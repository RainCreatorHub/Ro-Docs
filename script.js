const SUPABASE_URL = 'https://jdoszcpknbrimnuncfgm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impkb3N6Y3BrbmJyaW1udW5jZmdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYyOTU1NDEsImV4cCI6MjA5MTg3MTU0MX0.HAzfEPJ27yVNtVkCQlbZuckFNVJK-frRiJeUUTINwPo';

const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const authSection = document.getElementById('auth-section');
const fileManagerSection = document.getElementById('file-manager-section');
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const authStatus = document.getElementById('auth-status');
const logoutButton = document.getElementById('logout-button');
const fileInput = document.getElementById('file-input');
const uploadButton = document.getElementById('upload-button');
const uploadStatus = document.getElementById('upload-status');
const fileList = document.getElementById('file-list');
const apkVersionInput = document.getElementById('apk-version');
const apkDescriptionInput = document.getElementById('apk-description');

const BUCKET_NAME = 'apk-files';

function showFileManager() {
    authSection.classList.add('hidden');
    fileManagerSection.classList.remove('hidden');
    listFiles();
}

function showAuth() {
    authSection.classList.remove('hidden');
    fileManagerSection.classList.add('hidden');
}

signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    const { error } = await supabase.auth.signUp({ email, password });
    authStatus.textContent = error ? `Erro: ${error.message}` : 'Cadastro realizado! Verifique seu e-mail (se habilitado).';
});

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) authStatus.textContent = `Erro: ${error.message}`;
    else showFileManager();
});

logoutButton.addEventListener('click', async () => {
    await supabase.auth.signOut();
    showAuth();
});

uploadButton.addEventListener('click', async () => {
    const file = fileInput.files[0];
    const version = apkVersionInput.value;
    const description = apkDescriptionInput.value;

    if (!file || !version) {
        uploadStatus.textContent = 'Por favor, preencha o arquivo e a versão.';
        return;
    }

    uploadStatus.textContent = 'Enviando arquivo...';
    uploadButton.disabled = true;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        uploadStatus.textContent = 'Usuário não autenticado. Faça login novamente.';
        uploadButton.disabled = false;
        return;
    }

    const { error: storageError } = await supabase.storage.from(BUCKET_NAME).upload(file.name, file, { upsert: false });

    if (storageError) {
        uploadStatus.textContent = `Erro no upload: ${storageError.message}`;
        uploadButton.disabled = false;
        return;
    }

    const { error: dbError } = await supabase.from('apks').insert({
        name: file.name,
        description: description,
        version: version,
        user_id: user.id,
        last_updated: new Date().toISOString()
    });

    if (dbError) {
        uploadStatus.textContent = `Erro ao salvar metadados: ${dbError.message}`;
        await supabase.storage.from(BUCKET_NAME).remove([file.name]);
    } else {
        uploadStatus.textContent = 'Upload concluído com sucesso!';
        fileInput.value = '';
        apkVersionInput.value = '';
        apkDescriptionInput.value = '';
        await listFiles();
    }
    uploadButton.disabled = false;
});

async function listFiles() {
    fileList.innerHTML = '<li>Carregando arquivos...</li>';
    
    const { data, error } = await supabase.from('apks').select('*').order('created_at', { ascending: false });

    if (error) {
        fileList.innerHTML = `<li>Erro ao carregar: ${error.message}</li>`;
        return;
    }
    if (data.length === 0) {
        fileList.innerHTML = '<li>Nenhum arquivo encontrado.</li>';
        return;
    }

    fileList.innerHTML = '';
    data.forEach(apk => {
        const { data: urlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(apk.name);
        const li = document.createElement('li');
        li.classList.add('file-item');
        li.innerHTML = `
            <div class="file-info">
                <strong class="file-name">${apk.name}</strong>
                <span class="file-version">Versão: ${apk.version}</span>
                <p class="file-description">${apk.description || 'Sem descrição'}</p>
                <span class="file-date">Atualizado em: ${new Date(apk.last_updated).toLocaleDateString('pt-BR')}</span>
            </div>
            <div class="file-actions">
                <a href="${urlData.publicUrl}" class="action-button download" download>Baixar</a>
                <button class="action-button delete" data-id="${apk.id}" data-name="${apk.name}">Deletar</button>
            </div>
        `;
        fileList.appendChild(li);
    });
}

fileList.addEventListener('click', async (e) => {
    if (e.target.classList.contains('delete')) {
        const apkId = e.target.dataset.id;
        const apkName = e.target.dataset.name;

        const confirmed = confirm(`Tem certeza que deseja deletar o arquivo "${apkName}"? Esta ação não pode ser desfeita.`);
        if (!confirmed) return;

        e.target.disabled = true;
        e.target.textContent = 'Deletando...';

        const { error: dbError } = await supabase.from('apks').delete().match({ id: apkId });
        if (dbError) {
            alert(`Erro ao deletar informações: ${dbError.message}`);
            e.target.disabled = false;
            e.target.textContent = 'Deletar';
            return;
        }

        const { error: storageError } = await supabase.storage.from(BUCKET_NAME).remove([apkName]);
        if (storageError) {
            alert(`Informações deletadas, mas houve um erro ao remover o arquivo do storage: ${storageError.message}`);
        }
        
        e.target.closest('.file-item').remove();
    }
});

document.addEventListener('DOMContentLoaded', async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
        showFileManager();
    } else {
        showAuth();
    }
});

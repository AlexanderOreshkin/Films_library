const deleteAllButton = document.querySelector('.delete-all-button');
const filmFormElement = document.getElementById('film-form');
const submitButton = document.querySelector('#submit-btn');
const cancelEditButton = document.getElementById('cancel-edit-btn');
const titleInput = document.querySelector('#film-title');
const genreInput = document.querySelector('#film-genre');
const yearInput = document.querySelector('#film-year');
const watchedCheckbox = document.querySelector('#film-watched');
const filterTitleInput = document.getElementById('filter-title');
const filterGenreInput = document.getElementById('filter-genre');
const filterYearInput = document.getElementById('filter-year');
const filterWatchedSelect = document.getElementById('filter-watched');

const authModal = document.getElementById('auth-modal');
const authForm = document.getElementById('auth-form');
const authNameInput = document.getElementById('auth-name');
const authEmailInput = document.getElementById('auth-email');
const authNameError = document.getElementById('auth-name-error');
const authEmailError = document.getElementById('auth-email-error');
const skipAuthBtn = document.getElementById('skip-auth-btn');

const userProfile = document.getElementById('user-profile');
const userGreeting = document.getElementById('user-greeting');
const logoutBtn = document.getElementById('logout-btn');

let userEmail = 'defaultuser@mail.ru';
let userName = '';
let films = [];
let editingFilmId = null;
let isAuthenticated = false;

// Проверка авторизации при загрузке
function checkAuth() {
    const savedUser = localStorage.getItem('userData');
    if (savedUser) {
        const userData = JSON.parse(savedUser);
        userName = userData.name;
        userEmail = userData.email;
        isAuthenticated = true;
        updateUserProfile();
        showNotification(`Привет, ${userName}!`, 'success');
        return true;
    }
    return false;
}

// Обновление профиля пользователя
function updateUserProfile() {
    if (isAuthenticated && userName) {
        userProfile.style.display = 'flex';
        userGreeting.textContent = `👋 Привет, ${userName}`;
    } else {
        userProfile.style.display = 'none';
    }
}

// Выход из профиля
function logout() {
    localStorage.removeItem('userData');
    isAuthenticated = false;
    userName = '';
    userEmail = 'defaultuser@mail.ru';
    userProfile.style.display = 'none';
    films = [];
    renderTable([]);
    showNotification('Вы вышли из профиля', 'warning');
    authModal.style.display = 'flex';
}

// Валидация формы авторизации
function validateAuthForm() {
    let isValid = true;
    
    if (!authNameInput.value.trim()) {
        authNameError.textContent = 'Пожалуйста, введите ваше имя';
        authNameInput.classList.add('error');
        isValid = false;
    } else {
        authNameError.textContent = '';
        authNameInput.classList.remove('error');
    }
    
    const emailValue = authEmailInput.value.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailValue) {
        authEmailError.textContent = 'Пожалуйста, введите ваш email';
        authEmailInput.classList.add('error');
        isValid = false;
    } else if (!emailRegex.test(emailValue)) {
        authEmailError.textContent = 'Пожалуйста, введите корректный email';
        authEmailInput.classList.add('error');
        isValid = false;
    } else {
        authEmailError.textContent = '';
        authEmailInput.classList.remove('error');
    }
    
    return isValid;
}

// Авторизации
async function handleAuthSubmit(event) {
    event.preventDefault();
    if (!validateAuthForm()) return;
    
    userName = authNameInput.value.trim();
    userEmail = authEmailInput.value.trim();
    isAuthenticated = true;
    
    localStorage.setItem('userData', JSON.stringify({
        name: userName,
        email: userEmail
    }));
    
    authModal.style.display = 'none';
    updateUserProfile();
    showNotification(`Привет, ${userName}!`, 'success');
    
    await loadFilms();
    applyFilters();
}

// Пропуск авторизации
function skipAuth() {
    isAuthenticated = false;
    userEmail = 'defaultuser@mail.ru';
    userName = 'Гость';
    authModal.style.display = 'none';
    showNotification('Вы вошли как гость', 'warning');
    
    loadFilms();
    applyFilters();
}

// Валидация формы фильма
function validateFilmForm() {
    let isValid = true;

    const titleError = document.querySelector('#title-error');
    if (!titleInput.value.trim()) {
        titleError.textContent = 'Пожалуйста, введите название фильма';
        titleInput.classList.add('error');
        isValid = false;
    } else {
        titleError.textContent = '';
        titleInput.classList.remove('error');
    }

    const genreError = document.querySelector('#genre-error');
    if (!genreInput.value.trim()) {
        genreError.textContent = 'Пожалуйста, введите жанр фильма';
        genreInput.classList.add('error');
        isValid = false;
    } else {
        genreError.textContent = '';
        genreInput.classList.remove('error');
    }

    const yearError = document.querySelector('#year-error');
    const yearValue = yearInput.value.trim();

    if (!yearValue) {
        yearError.textContent = 'Пожалуйста, введите год выпуска';
        yearInput.classList.add('error');
        isValid = false;
    } else if (!/^\d{4}$/.test(yearValue)) {
        yearError.textContent = 'Год должен состоять из 4 цифр';
        yearInput.classList.add('error');
        isValid = false;
    } else {
        yearError.textContent = '';
        yearInput.classList.remove('error');
    }

    return isValid;
}

function clearFormErrors() {
    document.querySelectorAll('.error-message').forEach(error => error.textContent = '');
    document.querySelectorAll('.error').forEach(input => input.classList.remove('error'));
}

function resetForm() {
    filmFormElement.reset();
    clearFormErrors();
    editingFilmId = null;
    submitButton.value = 'Добавить фильм';
    cancelEditButton.style.display = 'none';
}

function startEditFilm(film) {
    titleInput.value = film.title;
    genreInput.value = film.genre;
    yearInput.value = film.releaseYear;
    watchedCheckbox.checked = film.isWatched;
    editingFilmId = film.id;
    submitButton.value = 'Обновить фильм';
    cancelEditButton.style.display = 'block';
   
    filmFormElement.scrollIntoView({ behavior: 'smooth' });
}

async function handleFormSubmit(event) {
    event.preventDefault();
    if (!validateFilmForm()) return;

    const film = {
        title: titleInput.value.trim(),
        genre: genreInput.value.trim(),
        releaseYear: yearInput.value.trim(),
        isWatched: watchedCheckbox.checked,
    };

    if (editingFilmId) {
        await updateFilm(editingFilmId, film);
    } else {
        await addFilm(film);
    }
   
    resetForm();
}

// Работа с localStorage
function saveFilmsToLocalStorage(filmsData) {
    try {
        localStorage.setItem('films', JSON.stringify(filmsData));
    } catch (error) {
        console.error('Ошибка сохранения фильмов в localStorage:', error);
    }
}

function loadFilmsFromLocalStorage() {
    try {
        const savedFilms = localStorage.getItem('films');
        if (savedFilms) {
            return JSON.parse(savedFilms);
        }
        return null;
    } catch (error) {
        console.error('Ошибка загрузки фильмов из localStorage:', error);
        return null;
    }
}

function clearFilmsFromLocalStorage() {
    localStorage.removeItem('films');
}

// Работа с API

async function addFilm(film) {
    try {
        const response = await fetch('https://sb-film.skillbox.cc/films', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                email: userEmail,
            },
            body: JSON.stringify(film),
        });

        if (!response.ok) throw new Error('Не удалось добавить фильм');
        showNotification('Фильм успешно добавлен', 'success');
        await loadFilms();
        applyFilters();
    } catch (error) {
        console.error(error);
        showNotification('Произошла ошибка при добавлении фильма', 'error');
    }
}

async function updateFilm(id, film) {
    try {
        const response = await fetch(`https://sb-film.skillbox.cc/films/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                email: userEmail,
            },
            body: JSON.stringify(film),
        });

        if (!response.ok) throw new Error('Не удалось обновить фильм');
        showNotification('Фильм успешно обновлен', 'success');
        await loadFilms();
        applyFilters();
    } catch (error) {
        console.error(error);
        showNotification('Произошла ошибка при обновлении фильма', 'error');
    }
}

async function loadFilms() {
    try {
        const response = await fetch('https://sb-film.skillbox.cc/films', {
            headers: { email: userEmail },
        });
       
        if (!response.ok) throw new Error('Не удалось загрузить фильмы');
        films = await response.json();
        // Сохраняем полученные фильмы в localStorage
        saveFilmsToLocalStorage(films);
    } catch (error) {
        console.error(error);
        // При ошибке загружаем из localStorage
        const localFilms = loadFilmsFromLocalStorage();
        if (localFilms && localFilms.length > 0) {
            films = localFilms;
            showNotification('Загружены фильмы из локального хранилища', 'warning');
        } else {
            films = [];
            showNotification('Ошибка при загрузке списка фильмов', 'error');
        }
    }
}

// Отрисовка таблицы

async function renderTable(filmsToRender) {
    const filmsTableBody = document.getElementById('films-body');
    filmsTableBody.innerHTML = '';
   
    filmsToRender.forEach((film) => {
        const row = document.createElement('tr');
        const titleCell = document.createElement('td');
        titleCell.textContent = film.title;
        row.appendChild(titleCell);

        const genreCell = document.createElement('td');
        genreCell.textContent = film.genre;
        row.appendChild(genreCell);

        const yearCell = document.createElement('td');
        yearCell.textContent = film.releaseYear;
        row.appendChild(yearCell);

        const watchedCell = document.createElement('td');
        watchedCell.textContent = film.isWatched ? 'Просмотрен' : 'Не просмотрен';
        row.appendChild(watchedCell);

        const actionsCell = document.createElement('td');
        actionsCell.classList.add('table-actions');
        const editButton = document.createElement('button');
        editButton.className = 'edit-button';
        editButton.type = 'button';
        editButton.textContent = 'Редактировать';
        editButton.addEventListener('click', () => startEditFilm(film));
        actionsCell.appendChild(editButton);

        const deleteButton = document.createElement('button');
        deleteButton.className = 'delete-button';
        deleteButton.type = 'button';
        deleteButton.textContent = 'Удалить';
        deleteButton.addEventListener('click', () => deleteFilm(film.id));
        actionsCell.appendChild(deleteButton);

        row.appendChild(actionsCell);
        filmsTableBody.appendChild(row);
    });
}

// Фильтрация

function applyFilters() {
    const titleFilter = filterTitleInput.value.toLowerCase().trim();
    const genreFilter = filterGenreInput.value.toLowerCase().trim();
    const yearFilter = filterYearInput.value.trim();
    const watchedFilter = filterWatchedSelect.value;

    const filteredFilms = films.filter(film => {
        const matchesTitle = titleFilter === '' || film.title.toLowerCase().includes(titleFilter);
        const matchesGenre = genreFilter === '' || film.genre.toLowerCase().includes(genreFilter);
        const matchesYear = yearFilter === '' || film.releaseYear.toString().includes(yearFilter);
       
        let matchesWatched = true;
        if (watchedFilter === 'watched') matchesWatched = film.isWatched === true;
        else if (watchedFilter === 'notwatched') matchesWatched = film.isWatched === false;
       
        return matchesTitle && matchesGenre && matchesYear && matchesWatched;
    });

    renderTable(filteredFilms);
}

async function deleteAllFilms() {
    const isConfirmed = await showConfirmDialog('Вы уверены, что хотите удалить ВСЕ фильмы? Это действие необратимо.');
    if (!isConfirmed) return;
   
    try {
        const response = await fetch('https://sb-film.skillbox.cc/films', {
            method: 'DELETE',
            headers: { email: userEmail },
        });
       
        if (!response.ok) throw new Error('Не удалось удалить все фильмы');
        showNotification('Все фильмы успешно удалены', 'success');
        films = [];
        clearFilmsFromLocalStorage();
        applyFilters();
    } catch (error) {
        console.error(error);
        showNotification('Произошла ошибка при удалении всех фильмов', 'error');
    }
}

async function deleteFilm(id) {
    const isConfirmed = await showConfirmDialog('Вы уверены, что хотите удалить этот фильм?');
    if (!isConfirmed) return;

    try {
        const response = await fetch(`https://sb-film.skillbox.cc/films/${id}`, {
            method: 'DELETE',
            headers: { email: userEmail },
        });
       
        if (!response.ok) throw new Error('Не удалось удалить фильм');
        showNotification('Фильм успешно удален', 'success');
        await loadFilms();
        applyFilters();
    } catch (error) {
        console.error(error);
        showNotification('Произошла ошибка при удалении фильма', 'error');
    }
}

function showNotification(message, type = 'error') {
    const container = document.getElementById('notifications-container');
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    container.appendChild(notification);
   
    setTimeout(() => {
        notification.remove();
    }, 4000);
}

function showConfirmDialog(message) {
    return new Promise((resolve) => {
        const modal = document.getElementById('confirm-modal');
        const messageElement = document.getElementById('confirm-message');
        const yesButton = document.getElementById('confirm-yes');
        const noButton = document.getElementById('confirm-no');

        messageElement.textContent = message;
        modal.style.display = 'flex';

        const cleanup = () => {
            modal.style.display = 'none';
            yesButton.onclick = null;
            noButton.onclick = null;
        };

        yesButton.onclick = () => { cleanup(); resolve(true); };
        noButton.onclick = () => { cleanup(); resolve(false); };
    });
}

// Инициализация событий

filmFormElement.addEventListener('submit', handleFormSubmit);
cancelEditButton.addEventListener('click', resetForm);
deleteAllButton.addEventListener('click', deleteAllFilms);

filterTitleInput.addEventListener('input', applyFilters);
filterGenreInput.addEventListener('input', applyFilters);
filterYearInput.addEventListener('input', applyFilters);
filterWatchedSelect.addEventListener('change', applyFilters);

authForm.addEventListener('submit', handleAuthSubmit);
skipAuthBtn.addEventListener('click', skipAuth);

logoutBtn.addEventListener('click', logout);

// Инициализация приложения
function initApp() {

    if (!checkAuth()) {
        authModal.style.display = 'flex';
    } else {
        loadFilms().then(() => applyFilters());
    }
}

initApp();
const deleteAllBtn = document.querySelector('.deleteAll');
const filmForm = document.getElementById('film-form');
const submitBtn = document.querySelector('#submit-btn');
const cancelEditBtn = document.getElementById('cancel-edit-btn');
const titleInput = document.querySelector('#title');
const genreInput = document.querySelector('#genre');
const yearInput = document.querySelector('#releaseYear');
const watchedInput = document.querySelector('#isWatched');
const filTitle = document.getElementById('filTitle');
const filGenre = document.getElementById('filGenre');
const filYear = document.getElementById('filYear');
const filWatched = document.getElementById('filWatched');

const userEmail = 'defaultuser@mail.ru';

let filmsList = [];
let editingFilmId = null;

// Валидация и работа с формой
function validateForm() {
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

  const yearError = document.querySelector('#releaseYear-error');
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

function clearErrors() {
  document.querySelectorAll('.error-message').forEach(error => error.textContent = '');
  document.querySelectorAll('.error').forEach(input => input.classList.remove('error'));
}

function resetFormState() {
  filmForm.reset();
  clearErrors();
  editingFilmId = null;
  submitBtn.value = "Добавить фильм";
  cancelEditBtn.style.display = 'none';
}

function startEdit(film) {
  titleInput.value = film.title;
  genreInput.value = film.genre;
  yearInput.value = film.releaseYear;
  watchedInput.checked = film.isWatched;
  editingFilmId = film.id;
  submitBtn.value = "Обновить фильм";
  cancelEditBtn.style.display = 'block';
  
  filmForm.scrollIntoView({ behavior: 'smooth' });
}

async function handleFormSubmit(e) {
  e.preventDefault();
  if (!validateForm()) return;

  const film = {
    title: titleInput.value.trim(),
    genre: genreInput.value.trim(),
    releaseYear: yearInput.value.trim(),
    isWatched: watchedInput.checked,
  };

  if (editingFilmId) {
    await updateFilm(editingFilmId, film);
  } else {
    await addFilm(film);
  }
  
  resetFormState();
}

// Работа с API
async function addFilm(film) {
  try {
    const response = await fetch("https://sb-film.skillbox.cc/films", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        email: userEmail,
      },
      body: JSON.stringify(film),
    });

    if (!response.ok) throw new Error("Не удалось добавить фильм");
    showToast("Фильм успешно добавлен", "success");
    await loadFilms();
    filterFilms();
  } catch (error) {
    console.error(error);
    showToast("Произошла ошибка при добавлении фильма", "error");
  }
}

async function updateFilm(id, film) {
  try {
    const response = await fetch(`https://sb-film.skillbox.cc/films/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        email: userEmail,
      },
      body: JSON.stringify(film),
    });

    if (!response.ok) throw new Error("Не удалось обновить фильм");
    showToast("Фильм успешно обновлен", "success");
    await loadFilms();
    filterFilms();
  } catch (error) {
    console.error(error);
    showToast("Произошла ошибка при обновлении фильма", "error");
  }
}

async function loadFilms() {
  try {
    const filmsResponse = await fetch("https://sb-film.skillbox.cc/films", {
      headers: { email: userEmail },
    });
    
    if (!filmsResponse.ok) throw new Error("Не удалось загрузить фильмы");
    filmsList = await filmsResponse.json();
  } catch (error) {
    console.error(error);
    showToast("Ошибка при загрузке списка фильмов", "error");
    filmsList = [];
  }
}

async function renderTable(filmsToRender) {
  const filmTableBody = document.getElementById("film-tbody");
  filmTableBody.innerHTML = "";
  
  filmsToRender.forEach((film) => {
    const row = document.createElement("tr");

    const titleTd = document.createElement("td");
    titleTd.textContent = film.title;
    row.appendChild(titleTd);

    const genreTd = document.createElement("td");
    genreTd.textContent = film.genre;
    row.appendChild(genreTd);

    const yearTd = document.createElement("td");
    yearTd.textContent = film.releaseYear;
    row.appendChild(yearTd);

    const watchedTd = document.createElement("td");
    watchedTd.textContent = film.isWatched ? "Просмотрен" : "Не просмотрен";
    row.appendChild(watchedTd);

    const actionTd = document.createElement("td");

    const editBtn = document.createElement("button");
    editBtn.className = "editBtn";
    editBtn.type = "button";
    editBtn.textContent = "Редактировать";
    editBtn.addEventListener('click', () => startEdit(film));
    actionTd.appendChild(editBtn);

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "deleteBtn delete";
    deleteBtn.type = "button";
    deleteBtn.textContent = "Удалить";
    deleteBtn.addEventListener('click', () => deleteFilm(film.id));
    actionTd.appendChild(deleteBtn);

    row.appendChild(actionTd);
    filmTableBody.appendChild(row);
  });
}

function filterFilms() {
  const titleFilter = filTitle.value.toLowerCase().trim();
  const genreFilter = filGenre.value.toLowerCase().trim();
  const yearFilter = filYear.value.trim();
  const watchedFilter = filWatched.value;

  const filteredFilms = filmsList.filter(film => {
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
  const isConfirmed = await showConfirm("Вы уверены, что хотите удалить ВСЕ фильмы? Это действие необратимо.");
  if (!isConfirmed) return;
  
  try {
    const response = await fetch("https://sb-film.skillbox.cc/films", {
      method: "DELETE",
      headers: { email: userEmail },
    });
    
    if (!response.ok) throw new Error("Не удалось удалить все фильмы");
    showToast("Все фильмы успешно удалены", "success");
    filmsList = [];
    filterFilms();
  } catch (error) {
    console.error(error);
    showToast("Произошла ошибка при удалении всех фильмов", "error");
  }
}

async function deleteFilm(id) {
  const isConfirmed = await showConfirm("Вы уверены, что хотите удалить этот фильм?");
  if (!isConfirmed) return;

  try {
    const response = await fetch(`https://sb-film.skillbox.cc/films/${id}`, {
      method: "DELETE",
      headers: { email: userEmail },
    });
    
    if (!response.ok) throw new Error("Не удалось удалить фильм");
    showToast("Фильм успешно удален", "success");
    await loadFilms();
    filterFilms();
  } catch (error) {
    console.error(error);
    showToast("Произошла ошибка при удалении фильма", "error");
  }
}

//Вспомогательные функции для всплывающих окон
function showToast(message, type = 'error') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  
  setTimeout(() => {
    toast.remove();
  }, 4000);
}

function showConfirm(message) {
  return new Promise((resolve) => {
    const modal = document.getElementById('confirm-modal');
    const msgEl = document.getElementById('confirm-message');
    const yesBtn = document.getElementById('confirm-yes');
    const noBtn = document.getElementById('confirm-no');

    msgEl.textContent = message;
    modal.style.display = 'flex';

    const cleanup = () => {
      modal.style.display = 'none';
      yesBtn.onclick = null;
      noBtn.onclick = null;
    };

    yesBtn.onclick = () => { cleanup(); resolve(true); };
    noBtn.onclick = () => { cleanup(); resolve(false); };
  });
}

// Инициализация событий
filmForm.addEventListener("submit", handleFormSubmit);
cancelEditBtn.addEventListener('click', resetFormState);
deleteAllBtn.addEventListener('click', deleteAllFilms);

filTitle.addEventListener('input', filterFilms);
filGenre.addEventListener('input', filterFilms);
filYear.addEventListener('input', filterFilms);
filWatched.addEventListener('change', filterFilms);

// Первичная загрузка
loadFilms().then(() => filterFilms());
const deleteAllBtn = document.querySelector('.deleteAll');
deleteAllBtn.addEventListener('click', () => deleteAllFilms())
const titleInput = document.querySelector('#title');
const genreInput = document.querySelector('#genre');
const yearInput = document.querySelector('#releaseYear');
const watchedInput = document.querySelector('#isWatched')
const filTitle = document.getElementById('filTitle');
const filGenre = document.getElementById('filGenre');
const filYear = document.getElementById('filYear');
const filWatched = document.getElementById('filWatched');
let filmsList = [];



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
  const errorMessages = document.querySelectorAll('.error-message');
  errorMessages.forEach(error => {
    error.textContent = '';
  });

  const errorInputs = document.querySelectorAll('.error');
  errorInputs.forEach(input => {
    input.classList.remove('error');
  });
}


function handleFormSubmit(e) {
  e.preventDefault();
  if (!validateForm()) {
    return;
  }
  const title = titleInput.value;
  const genre = genreInput.value;
  const releaseYear = yearInput.value;
  const isWatched = watchedInput.checked;

  const film = {
    title: title,
    genre: genre,
    releaseYear: releaseYear,
    isWatched: isWatched,
  };

  addFilm(film);
  e.target.reset();
  clearErrors();
}

async function addFilm(film) {
  try {
    const response = await fetch("https://sb-film.skillbox.cc/films", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        email: "oreshkin.alexander@gmail.com",
      },
      body: JSON.stringify(film),
    });

    if (!response.ok) {
      throw new Error("Не удалось добавить фильм");
    }

    await loadFilms();
    filterFilms();

  } catch (error) {
    console.error(error);
    alert("Произошла ошибка при добавлении фильма");
  }
}

async function loadFilms() {
  const filmsResponse = await fetch("https://sb-film.skillbox.cc/films", {
    headers: {
      email: "oreshkin.alexander@gmail.com",
    },
  });
  filmsList = await filmsResponse.json();
}

async function renderTable(filmsToRender) {
  const filmTableBody = document.getElementById("film-tbody");
  filmTableBody.innerHTML = "";
  filmsToRender.forEach((film) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${film.title}</td>
      <td>${film.genre}</td>
      <td>${film.releaseYear}</td>
      <td>${film.isWatched ? "Да" : "Нет"}</td>
      <td>
           <button class="deleteBtn delete" type="button">Удалить</button>
            </td>
    `;
    const deleteBtn = row.querySelector('.deleteBtn');
    deleteBtn.addEventListener('click', () => deleteFilm(film.id));
    filmTableBody.appendChild(row);
  });
}

function filterFilms() {
  const titleFilter = filTitle.value.toLowerCase().trim();
  const genreFilter = filGenre.value.toLowerCase().trim();
  const yearFilter = filYear.value.trim();
  const watchedFilter = filWatched.value;

  const filteredFilms = filmsList.filter(film => {
    const matchesTitle = titleFilter === '' || 
                        film.title.toLowerCase().includes(titleFilter);
    
    const matchesGenre = genreFilter === '' || 
                        film.genre.toLowerCase().includes(genreFilter);
    
    const matchesYear = yearFilter === '' || 
                       film.releaseYear.toString().includes(yearFilter);
    
    let matchesWatched = true;
    if (watchedFilter === 'watched') {
      matchesWatched = film.isWatched === true;
    } else if (watchedFilter === 'notwatched') {
      matchesWatched = film.isWatched === false;
    }
    return matchesTitle && matchesGenre && matchesYear && matchesWatched;
  });

  renderTable(filteredFilms);
}

async function deleteAllFilms() {
  await fetch("https://sb-film.skillbox.cc/films", {
    method: "DELETE",
    headers: {
      email: "oreshkin.alexander@gmail.com",
    },
  });

  filmsList = [];
  filterFilms();
}

async function deleteFilm(id) {
  await fetch(`https://sb-film.skillbox.cc/films/${id}`, {
    method: "DELETE",
    headers: {
      email: "oreshkin.alexander@gmail.com",
    },
  });
  await loadFilms();
  filterFilms();
}


document
  .getElementById("film-form")
  .addEventListener("submit", handleFormSubmit);

loadFilms().then(() => {
  filterFilms(); 
});

filTitle.addEventListener('input', filterFilms);
filGenre.addEventListener('input', filterFilms);
filYear.addEventListener('input', filterFilms);
filWatched.addEventListener('change', filterFilms);
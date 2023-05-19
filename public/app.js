import { options } from './config/tmdb.js';

// Initialize Firebase app
import { firebaseConfig } from './config/firebase.js';
firebase.initializeApp(firebaseConfig);

// Redirect to the login page if the user is not authenticated
firebase.auth().onAuthStateChanged((user) => {
    if (!user) {
        window.location.href = 'login.html';
    }
});

// Logout handling
const logoutButton = document.getElementById('logout-button');
logoutButton.addEventListener('click', () => {
    firebase.auth().signOut()
    .then(() => {
        // Redirect to login page or desired page
        window.location.href = 'login.html';
    })
    .catch((error) => {
        // Handle logout error
        console.log(error);
    });
});

// Remove options from title search dropdown
function removeOptions(element) {
    for (let i = element.options.length - 1; i >= 0; i--) {
        element.remove(i);
    }
}

// Update film search box
const movieTitleSearch = document.getElementById('title');
movieTitleSearch.addEventListener('change', (e) => {
    e.preventDefault();
    
    var title = movieTitleSearch.value;
    var search = document.getElementById('search');
    var req = 'https://api.themoviedb.org/3/search/movie?query=' + title;
    fetch(req, options)
        .then(response => response.json())
        .then(response => {
            removeOptions(search);
            for (let i = 0; i < 3; i++) {
                var searchResult = document.createElement('option');
                var resultID = response.results[i].id;
                var resultTitle = response.results[i].title;
                searchResult.value = resultID;
                searchResult.text = resultTitle;
                search.add(searchResult);
            }
        })
        .catch(err => console.error(err));
});

// Handle form submission
const addMovieForm = document.getElementById('add-movie-form');
addMovieForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const title = addMovieForm['title'].value;

    // Create and send request to TMDB
    var req = 'https://api.themoviedb.org/3/search/movie?query=' + title;
    fetch(req, options)
        .then(response => response.json())
        .then(response => console.log(response))
        .catch(err => console.error(err));

    // Add movie to Firebase Realtime Database
    const currentUser = firebase.auth().currentUser;
    const userRef = firebase.database().ref(`users/${currentUser.uid}`);
    const moviesRef = userRef.child('movies');
    const newMovieRef = moviesRef.push();
    newMovieRef.set({ title });

    // Clear form fields
    addMovieForm.reset();
});

// Display list of movies for the current user
firebase.auth().onAuthStateChanged((user) => {
    if (user) {
        const userRef = firebase.database().ref(`users/${user.uid}`);
        userRef.child('movies').on('value', (snapshot) => {
        const movies = snapshot.val();
        const movieList = document.getElementById('movie-list');
        movieList.innerHTML = '';
        for (const movieKey in movies) {
            const movie = movies[movieKey];
            const movieItem = document.createElement('li');
            movieItem.innerHTML = `<strong>${movie.title}</strong> directed by `;
            movieList.appendChild(movieItem);
        }
        });
    } else {
        window.location.href = 'login.html';
    }
});
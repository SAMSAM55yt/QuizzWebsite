// Import external componenets for file loading system and some utitlity functions
import * as api from './load-api.js';
import * as lib from './utility-lib.js';

// Variables definiftions
const quizContainer = document.querySelector('.quiz-main');
let timerInterval;
let animationFrameId;
let NumberOfQuestions = api.get_num_questions();
let IsLastAnswerCorrect = false;
let canAnswer = true;
let CurrentQuestion = 0;
let answerStreak = 0;
let score = 0;
let selectedAnswer = null;
globalThis.selectedAnswer = selectedAnswer;
let hasAnswered = false;



document.addEventListener('DOMContentLoaded', () => {
    api.get_selected_quiz_data()
    .then(data => {
        initializeQuiz(data);
    })
    .catch(error => {
        console.log("File path : ", api.get_file_path())
        console.error('Error:', error);
    });
});

function show_question(list, index) {
    let question = list[index];

    if (!question || (!question.options && question.answerType === "multipleOptions") || !list[index]) {
        console.error('Question or options not found');
        return;
        
    }


    const questionElement = document.createElement('div');
    questionElement.classList.add('answer-container');
    if (question.answerType === "multipleOptions") {
        const optionsWithIndex = question.options.map((option, i) => ({ option, index: i }));
        const shuffledOptions = lib.shuffleArray(optionsWithIndex);

        questionElement.innerHTML = `
            <h2 class="main-question-text">Question ${index + 1}: ${question.question}</h2>
            <progress class="timer" id="timer" value="0" max="100"></progress>
            <ul class="quiz-answer-list" correct-answer="${question.correctAnswer-1}">
                ${shuffledOptions.map(({ option, index }) => `
                        <button class="quiz-answer-button" style="--border-color:black;" correct-answer=${index == question.correctAnswer - 1}>
                            <a class="answer-button-text" answer-index=${index}>${option}</a>
                            <span class="answer-indicator"><i class="fa-regular fa-circle-xmark"></i></span>
                        </button>
                `).join('')}
            </ul>
            <div class="quiz-utility-buttons-container">
            </div>
            <div class="quiz-score-container">
                <p class="quiz-score-text">Score: <span id="score">0</span></p>
                <p class="quiz-question-text">Question: <span id="question-index">0</span></p>    
            </div>
        `;

        if (index+1 == NumberOfQuestions) {
            questionElement.querySelector('.quiz-utility-buttons-container').innerHTML = `
                <button class="quiz-utility-button" id="finish-quiz" onclick="nextQuestion(quizData)">
                <p class="quiz-utility-button-text">Résultats <i class="fa-solid fa-arrow-right"></i></p>
                <button class="quiz-utility-button" id="submit-answer" onclick="checkAnswer(globalThis.selectedAnswer, 'answer submitted')">
                <p class="quiz-utility-button-text">Valider</p>
                </button>
                </button>
            `;
        } else {
            questionElement.querySelector('.quiz-utility-buttons-container').innerHTML = `
                <button class="quiz-utility-button" id="next-question" onclick="nextQuestion(quizData)">
                <p class="quiz-utility-button-text">Question Suivante <i class="fa-solid fa-arrow-right"></i></p>
                </button>
                <button class="quiz-utility-button" id="submit-answer" onclick="checkAnswer(globalThis.selectedAnswer, 'answer submitted')">
                <p class="quiz-utility-button-text">Valider</p>
                </button>
            `;
        }

        return [question.time*1000, questionElement, question];
    }

    else if (question.answerType === "freeAnswer") {
        questionElement.innerHTML = `
            <h2 class="main-question-text">Question ${index + 1}: ${question.question}</h2>
            <progress class="timer" id="timer" value="0" max="100"></progress>
            <label for="answer-input">Votre réponse :</label>
            <input autocomplete="off" type="text" class="answer-input" id="answer-input" correct-answer="${question.correctAnswer}"></input>
            <p class="correct-answer-text">La bonne réponse est : ${question.correctAnswer}</p>
            <div class="quiz-utility-buttons-container">
            </div>
            <div class="quiz-score-container">
                <p class="quiz-score-text">Score: <span id="score">0</span></p>
                <p class="quiz-question-text">Question: <span id="question-index">0</span></p>    
            </div>
        `;

        if (index+1 == NumberOfQuestions) {
            questionElement.querySelector('.quiz-utility-buttons-container').innerHTML = `
                <button class="quiz-utility-button" id="finish-quiz" onclick="nextQuestion(quizData)">
                <p class="quiz-utility-button-text">Résultats <i class="fa-solid fa-arrow-right"></i></p>
                </button>
                <button class="quiz-utility-button" id="submit-answer" onclick="checkAnswer('', 'answer submitted')">
                <p class="quiz-utility-button-text">Valider</p>
                </button>
            `;
        } else {
            questionElement.querySelector('.quiz-utility-buttons-container').innerHTML = `
                <button class="quiz-utility-button" id="next-question" onclick="nextQuestion(quizData)">
                <p class="quiz-utility-button-text">Question Suivante <i class="fa-solid fa-arrow-right"></i></p>
                </button>
                <button class="quiz-utility-button" id="submit-answer" onclick="checkAnswer('placeholder', 'answer submitted')">
                <p class="quiz-utility-button-text">Valider</p>
                </button>
            `;
        }

        return[question.time*1000, questionElement, question]
    }
}

// Fonction pour initialiser le quiz avec les données
function initializeQuiz(data) {
    if (!quizContainer) {
        console.error('Element .quiz-main non trouvé');
        return;
    }
    quizContainer.innerHTML = `<h1>${data.quizTitle}</h1>`;
    // Add the first question

    const question_list = lib.pickrandomQuestions(data.questions, NumberOfQuestions);
    globalThis.question_list = question_list;
    const question_data = show_question(question_list, 0);
    globalThis.question = question_data[2]
    quizContainer.appendChild(question_data[1]);
    MathJax.typeset();
    updateScoreandQuestionLabels();
    globalThis.quizData = data;
    startTimer(question_data[0]);

}

// Test function for skipping the questions (debugging purposes only)

function skipQuestions() {
    for (let i = 0; i < NumberOfQuestions; i++) {
        score += 9.4;
        hasAnswered = true;
        nextQuestion(quizData);
    }
}

// Function for starting timer
function startTimer(duration) {
    globalThis.currentTime
    const timerElement = document.getElementById('timer');
    const startTime = Date.now();
    const endTime = startTime + duration;

    function updateTimer() {
        const currentTime = Date.now();
        const remainingTime = endTime - currentTime;
        const progress = Math.max(0, (remainingTime / duration) * 100);
        timerElement.value = progress;

        if (remainingTime > 0) {
            animationFrameId = requestAnimationFrame(updateTimer);
        } else {
            clearInterval(timerInterval);
            cancelAnimationFrame(animationFrameId);
            timerElement.value = 0;
            checkAnswer((globalThis.question.answerType === "multipleOptions" ? globalThis.selectedAnswer : globalThis.selectedAnswer ?? 'placeholder'), 'timer end');
        }
    }

    updateTimer();

    timerInterval = setInterval(() => {
        const currentTime = Date.now();
        const remainingTime = endTime - currentTime;
        if (hasAnswered) {
            clearInterval(timerInterval);
            return;
        }

        if (remainingTime <= 0) {
            clearInterval(timerInterval);
            cancelAnimationFrame(animationFrameId);
            timerElement.value = 0;
            canAnswer = false;
            checkAnswer((globalThis.question.answerType === "multipleOptions" ? globalThis.selectedAnswer : globalThis.selectedAnswer ?? 'placeholder'), 'timer end');
        }
    }, 1000);
}

function onCorrectAnswer() {
    IsLastAnswerCorrect = true;
    answerStreak++;   
    let timeRemaining = document.getElementById('timer').value/100;
    score += (timeRemaining > 0.75 ? 10 : (timeRemaining+0.25)*10);
    document.getElementById('score').innerHTML = lib.round(score, 1);
}

// Function for checking the answer
function checkAnswer(button, trigger) {
    console.log("Button : ", button)
    console.log("Trigger : ", trigger)
    console.log("Question : ", question)
    
    if ((button === null && question.answerType === "multipleOptions" && trigger != 'timer end') || hasAnswered) {
        console.log("Answer already submitted or no button clicked");
        return;
    }

    if (trigger == 'timer end' && button === null && question.answerType === "multipleOptions") {
        console.log("Timer ended");
        show_answer();
        canAnswer = false;
        hasAnswered = true;
        return;
    }
    
    if (trigger == 'answer submitted' || trigger == 'timer end' && button !== null) {
        console.log("Answer submitted");
        if (question.answerType === "multipleOptions") {
            if (button.getAttribute('correct-answer') == 'true') {
                onCorrectAnswer();
                show_answer();
            } else {
                IsLastAnswerCorrect = false;
                show_answer();
            }
        }

        else if (question.answerType === "freeAnswer") {
            const answerInput = document.getElementsByClassName('answer-input')[0];
            const submittedAnswer = String(answerInput.value).toLowerCase();
            const correctAnswer = String(answerInput.getAttribute('correct-answer')).toLowerCase();

            console.log("Submitted answer: ", submittedAnswer);
            console.log("Correct answer: ", correctAnswer);

            if (submittedAnswer === '' && trigger != 'timer end') {
                return;
            }

            else if (submittedAnswer === correctAnswer) {
                onCorrectAnswer();
                answerInput.classList.add('correct');
            }

            else {
                answerInput.classList.add('incorrect');
                document.getElementsByClassName('correct-answer-text')[0].classList.add('show')
            }
        }

    }

    cancelAnimationFrame(animationFrameId);
    canAnswer = false;

    if (question.answerType === "multipleOptions") {
        if (!IsLastAnswerCorrect && button.querySelector('.answer-indicator')) {
            button.style.setProperty('--border-color', 'red');
            button.querySelector('.answer-indicator').classList.add('answered');
            button.querySelector('.answer-indicator').innerHTML = '<i class="fa-regular fa-circle-xmark"></i>';
        }
    }

    hasAnswered = true;
}

function show_answer() {
    Array.from(document.getElementsByClassName('quiz-answer-button')).forEach((current_btn) => {
        if (current_btn.getAttribute('correct-answer') === 'true') {
            current_btn.style.setProperty('--border-color', 'green');
            current_btn.querySelector('.answer-indicator').classList.add('answered');
            current_btn.querySelector('.answer-indicator').innerHTML = '<i class="fa-regular fa-circle-check"></i>';
        }});
        
        canAnswer = false;

}

// Function for going to the next question
function nextQuestion(data) {
    console.log("Data : ", data)

    if (!hasAnswered) {
        return;        
    }

    hasAnswered = false;
    if (CurrentQuestion < NumberOfQuestions - 1) {
        CurrentQuestion++;
        const question_data = show_question(question_list, CurrentQuestion);
        const question_element = question_data[1];
        const question = question_data[2]
        globalThis.question = question
        quizContainer.innerHTML = '';
        quizContainer.appendChild(question_element);
        MathJax.typeset();
        canAnswer = true;
        startTimer(question_data[0]);
        updateScoreandQuestionLabels();
        globalThis.selectedAnswer = null;
        selectedAnswer = null;

    } else {
        quizContainer.innerHTML = `<h2>Fin du quiz!</h2>
        <span class=end-score-text> Votre score : 
            <span class="main-score-container">
                <span class="score-integer-container"></span>
                <span class="score-text">.</span>
                <span class="score-decimal-digit" value=0></span>
                <p class="max-score-text"> / ${NumberOfQuestions*10} </p>
            </span>
        </span>`;
        lib.animate_score(score, NumberOfQuestions*10, data);
    }
}

function updateScoreandQuestionLabels() {
    document.getElementById('question-index').innerHTML = `${CurrentQuestion+1} / ${NumberOfQuestions}`;
    document.getElementById('score').innerHTML = lib.round(score, 1);
}

document.addEventListener('click', (event) => {
    const btn = event.target.closest('.quiz-answer-button');
    if (btn && canAnswer) {
        selectedAnswer = btn;
        globalThis.selectedAnswer = selectedAnswer;
        clearInterval(timerInterval);
        console.log("Event target : ", event.target);
        console.log("Button : ", btn);
        document.querySelectorAll('.quiz-answer-button').forEach((button) => {
            button.classList.remove('selected');
        });
        btn.classList.add('selected');
    }
});

// Declaring the checkAnswer and nextQuestion functions in  the global scope to enable calls from html buttons
window.checkAnswer = checkAnswer;
window.nextQuestion = nextQuestion;

<?php

require __DIR__ . '/config.php';

session_start();

if ($_SERVER["REQUEST_METHOD"] === "POST") {

    if (!empty($_SESSION["user-id"])) { // Check if the user is authenticated

        echo json_encode(["user_name" => $_SESSION['user-name'], "user_email" => $_SESSION['user-email'], "logged_in" => $_SESSION['logged-in']]);

    } else {
        echo json_encode(["error" => "User ID missing."]);
    }
} else {
    echo json_encode(["error" => "Invalid request."]);
}

exit();

?>
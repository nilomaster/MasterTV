<?php
// Standard JSON Response Helper for MasterTV API
// Strictly ASCII comments only

if (!function_exists('sendResponse')) {
    function sendResponse($data, $status = 200) {
        http_response_code($status);
        header('Content-Type: application/json; charset=UTF-8');
        echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        exit();
    }
}

if (!function_exists('jsonSuccess')) {
    function jsonSuccess($data = [], $message = null) {
        $response = ['success' => true];
        if ($message !== null) {
            $response['message'] = $message;
        }
        if (is_array($data)) {
            $response = array_merge($response, $data);
        }
        sendResponse($response, 200);
    }
}

if (!function_exists('jsonError')) {
    function jsonError($message, $status = 400, $extra = []) {
        $response = array_merge(['success' => false, 'message' => $message], $extra);
        sendResponse($response, $status);
    }
}


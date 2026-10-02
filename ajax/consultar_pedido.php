<?php
require_once __DIR__ . '/../clases/consultas.php';

header('Content-Type: application/json; charset=utf-8');

$json = new StdClass();
$json->error = '';
$json->resp = '';

try {
    $codigo = strtoupper(trim($_POST['codigo'] ?? ''));
    if (!preg_match('/^[A-F0-9]{16}$/', $codigo)) {
        throw new RuntimeException('Ingresá un código de seguimiento válido');
    }

    $pedido = datos::pedido_por_codigo($codigo);
    if (!$pedido) {
        throw new RuntimeException('No encontramos un pedido con ese código');
    }
    $json->resp = $pedido;
} catch (Throwable $error) {
    $json->error = $error->getMessage();
}

echo json_encode($json);

<?php
require_once __DIR__ . '/../clases/consultas.php';

header('Content-Type: application/json; charset=utf-8');

$json = new StdClass();
$json->error = '';
$json->resp = '';

try {
    if (isset($_POST['listarPedidos'])) {
        $json->resp = datos::pedidos();
    } elseif (isset($_POST['actualizarEstadoPedido'])) {
        $id = filter_var($_POST['id'] ?? null, FILTER_VALIDATE_INT);
        $estado = trim($_POST['estado'] ?? '');
        if ($id === false || $id < 1) {
            throw new RuntimeException('ID de pedido inválido');
        }
        if (!datos::actualizar_estado_pedido($id, $estado)) {
            throw new RuntimeException('No se pudo actualizar el estado del pedido');
        }
        $json->resp = 'Estado del pedido actualizado';
    } else {
        $json->error = 'Solicitud inválida';
    }
} catch (Throwable $error) {
    $json->error = $error->getMessage();
}

echo json_encode($json);

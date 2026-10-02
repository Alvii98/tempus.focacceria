<?php
require_once __DIR__ . '/../clases/consultas.php';

header('Content-Type: application/json; charset=utf-8');

$json = new StdClass();
$json->error = '';
$json->resp = '';

try {
    $pedido = json_decode($_POST['pedido'] ?? '', true, 512, JSON_THROW_ON_ERROR);
    $fechaEntrega = trim($pedido['fecha_entrega'] ?? '');
    $contacto = trim($pedido['contacto'] ?? '');
    $direccion = trim($pedido['direccion'] ?? '');
    $observacion = trim($pedido['observacion'] ?? '');
    $productos = $pedido['productos'] ?? [];

    $zonaHoraria = new DateTimeZone('America/Argentina/Buenos_Aires');
    $fecha = DateTimeImmutable::createFromFormat('!Y-m-d', $fechaEntrega, $zonaHoraria);
    $erroresFecha = DateTimeImmutable::getLastErrors();
    $fechaInvalida = !$fecha || $fecha->format('Y-m-d') !== $fechaEntrega || ($erroresFecha && ($erroresFecha['warning_count'] || $erroresFecha['error_count']));
    if ($fechaInvalida) {
        throw new RuntimeException('La fecha de entrega no es válida');
    }

    $fechaMinima = new DateTimeImmutable('now', $zonaHoraria);
    $fechaMinima = $fechaMinima->modify('+72 hours');
    if ($fechaMinima->format('H:i:s') !== '00:00:00') {
        $fechaMinima = $fechaMinima->modify('+1 day');
    }
    if ($fechaEntrega < $fechaMinima->format('Y-m-d')) {
        throw new RuntimeException('La fecha debe respetar las 72 horas de anticipación');
    }

    if ($contacto === '' || $direccion === '') {
        throw new RuntimeException('El contacto y la dirección son obligatorios');
    }
    if (!is_array($productos) || count($productos) === 0) {
        throw new RuntimeException('El pedido no contiene productos');
    }

    $pedidoGuardado = datos::guardar_pedido($fechaEntrega, $contacto, $direccion, $observacion, $productos);
    if (!$pedidoGuardado) {
        throw new RuntimeException('No se pudo guardar el pedido. Revisá los productos y toppings e intentá nuevamente.');
    }

    $json->resp = $pedidoGuardado;
} catch (JsonException $error) {
    $json->error = 'Los datos del pedido no tienen un formato válido';
} catch (Throwable $error) {
    $json->error = $error->getMessage();
}

echo json_encode($json);
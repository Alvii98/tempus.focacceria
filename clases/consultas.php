<?php
require_once __DIR__ . '/SingletonConexion.php';
class datos{
    static public function productos($id_producto = null){
        try {
            $conn = SingletonConexion::getInstance()->getConnection();

            if (empty($id_producto)) {
                $query = "SELECT p.*, i.nombre AS imagen_nombre,c.nombre AS categoria_nombre,
                IF(i.nombre is not null, CONCAT('img/productos/', p.id, '/', i.nombre), 'img/sinimagen.png') AS imagen_ruta
                FROM productos p LEFT JOIN (SELECT id_producto, MIN(id) AS primera_imagen_id FROM imagenes
                GROUP BY id_producto) primera ON primera.id_producto = p.id
                LEFT JOIN imagenes i ON i.id = primera.primera_imagen_id 
                LEFT JOIN categoria c ON c.id = p.categoria
                ORDER BY p.id DESC";
                $result = mysqli_query($conn, $query);
            }else {
                $query = "SELECT p.*, i.nombre AS imagen_nombre,c.nombre AS categoria_nombre,
                IF(i.nombre is not null, CONCAT('img/productos/', p.id, '/', i.nombre), 'img/sinimagen.png') AS imagen_ruta
                FROM productos p LEFT JOIN (SELECT id_producto, MIN(id) AS primera_imagen_id FROM imagenes
                GROUP BY id_producto) primera ON primera.id_producto = p.id
                LEFT JOIN imagenes i ON i.id = primera.primera_imagen_id 
                LEFT JOIN categoria c ON c.id = p.categoria
                WHERE p.id = $id_producto ORDER BY p.id DESC";
                $result = mysqli_query($conn, $query);
            }
            
            if (!$result) return [];

            return $result->fetch_all(MYSQLI_ASSOC); 
        } catch (\Throwable $th) {
            return [];
        }
    }

    static public function buscar_productos($nombre, $categoria){
        try {
            $conn = SingletonConexion::getInstance()->getConnection();

            $query = "SELECT p.*, i.nombre AS imagen_nombre,c.nombre AS categoria_nombre,
            IF(i.nombre is not null, CONCAT('img/productos/', p.id, '/', i.nombre), 'img/sinimagen.png') AS imagen_ruta
            FROM productos p LEFT JOIN (SELECT id_producto, MIN(id) AS primera_imagen_id FROM imagenes
            GROUP BY id_producto) primera ON primera.id_producto = p.id
            LEFT JOIN imagenes i ON i.id = primera.primera_imagen_id
            LEFT JOIN categoria c ON c.id = p.categoria";

            $conditions = '';
            if (!empty($nombre)) $conditions = "p.nombre LIKE '%$nombre%'";
            if (!empty($categoria)) $conditions = $conditions ? "$conditions AND p.categoria = $categoria" : "p.categoria = $categoria";
            if (!empty($conditions)) $query .= " WHERE " . $conditions;
            
            $query .= " ORDER BY p.id DESC";

            $result = mysqli_query($conn, $query);
            
            if (!$result) return [];

            return $result->fetch_all(MYSQLI_ASSOC); 
        } catch (\Throwable $th) {
            return [];
        }
    }

    static public function imagenes_productos($id_producto){
        try {
            $conn = SingletonConexion::getInstance()->getConnection();
            
            $query = "SELECT id, nombre AS imagen_nombre, CONCAT('img/productos/', id_producto, '/', nombre) AS imagen_ruta FROM imagenes 
            WHERE id_producto = ? ORDER BY id ASC";
            
            $stmt = mysqli_prepare($conn, $query);
            if (!$stmt) return [];

            mysqli_stmt_bind_param($stmt, 'i', $id_producto);
            if (!mysqli_stmt_execute($stmt)) return [];
            
            $result = mysqli_stmt_get_result($stmt);
            return $result ? $result->fetch_all(MYSQLI_ASSOC) : [];
        } catch (\Throwable $th) {
            return [];
        }
    }

    static public function categorias(){
        try {
            $conn = SingletonConexion::getInstance()->getConnection();
            
            $query = "SELECT * FROM categoria ORDER BY nombre ASC";
            
            $result = mysqli_query($conn, $query);
            
            if (!$result) return [];
            
            return $result->fetch_all(MYSQLI_ASSOC); 
        } catch (\Throwable $th) {
            return [];
        }
    }

    static public function toppings(){
        try {
            $conn = SingletonConexion::getInstance()->getConnection();
            $result = mysqli_query($conn, "SELECT id, nombre, precio FROM toppings ORDER BY nombre ASC");
            return $result ? $result->fetch_all(MYSQLI_ASSOC) : [];
        } catch (\Throwable $th) {
            return [];
        }
    }

    static public function cargar_topping($nombre, $precio){
        try {
            $conn = SingletonConexion::getInstance()->getConnection();
            $stmt = mysqli_prepare($conn, "INSERT INTO toppings (nombre, precio, fecha_alta) VALUES (?, ?, NOW())");
            if (!$stmt) return false;

            $precio = (float) $precio;
            mysqli_stmt_bind_param($stmt, 'sd', $nombre, $precio);
            if (!mysqli_stmt_execute($stmt)) return false;

            return mysqli_insert_id($conn);
        } catch (\Throwable $th) {
            return false;
        }
    }

    static public function eliminar_topping($id){
        try {
            $conn = SingletonConexion::getInstance()->getConnection();
            $stmt = mysqli_prepare($conn, "DELETE FROM toppings WHERE id = ?");
            if (!$stmt) return false;

            $id = (int) $id;
            mysqli_stmt_bind_param($stmt, 'i', $id);
            return mysqli_stmt_execute($stmt) && mysqli_affected_rows($conn) > 0;
        } catch (\Throwable $th) {
            return false;
        }
    }

    static public function guardar_pedido($fecha_entrega, $contacto, $direccion, $observacion, $items){
        $conn = SingletonConexion::getInstance()->getConnection();
        if (!$conn || !mysqli_begin_transaction($conn)) return false;

        try {
            $idPedido = 0;
            $codigoSeguimiento = '';
            for ($attempt = 0; $attempt < 5; $attempt++) {
                $codigoSeguimiento = strtoupper(bin2hex(random_bytes(8)));
                $insertPedido = mysqli_prepare($conn, "INSERT INTO pedidos (codigo_seguimiento, fecha_entrega, contacto, direccion, observacion, total, estado, fecha_alta) VALUES (?, ?, ?, ?, ?, 0, 'pendiente', NOW())");
                if (!$insertPedido) throw new RuntimeException('No se pudo preparar el pedido');
                mysqli_stmt_bind_param($insertPedido, 'sssss', $codigoSeguimiento, $fecha_entrega, $contacto, $direccion, $observacion);
                if (mysqli_stmt_execute($insertPedido)) {
                    $idPedido = mysqli_insert_id($conn);
                    break;
                }
                if (mysqli_stmt_errno($insertPedido) !== 1062) throw new RuntimeException('No se pudo guardar el pedido');
            }
            if (!$idPedido) throw new RuntimeException('No se pudo generar un código único para el pedido');

            $buscarProducto = mysqli_prepare($conn, "SELECT id, nombre, valor, topping FROM productos WHERE id = ? LIMIT 1");
            $buscarTopping = mysqli_prepare($conn, "SELECT id, nombre, precio FROM toppings WHERE id = ? LIMIT 1");
            $insertDetalle = mysqli_prepare($conn, "INSERT INTO pedido_detalles (id_pedido, id_producto, producto_nombre, precio_unitario, cantidad, subtotal) VALUES (?, ?, ?, ?, ?, ?)");
            $insertDetalleTopping = mysqli_prepare($conn, "INSERT INTO pedido_detalle_toppings (id_pedido_detalle, id_topping, topping_nombre, precio_unitario, cantidad_por_producto, subtotal) VALUES (?, ?, ?, ?, ?, ?)");
            if (!$buscarProducto || !$buscarTopping || !$insertDetalle || !$insertDetalleTopping) {
                throw new RuntimeException('No se pudieron preparar los detalles del pedido');
            }

            $totalPedido = 0;
            $cantidadItems = 0;
            foreach ($items as $item) {
                $idProducto = filter_var($item['id'] ?? null, FILTER_VALIDATE_INT);
                $cantidadProducto = filter_var($item['cantidad'] ?? null, FILTER_VALIDATE_INT);
                if ($idProducto === false || $idProducto < 1 || $cantidadProducto === false || $cantidadProducto < 1) {
                    throw new RuntimeException('Hay un producto inválido en el pedido');
                }

                mysqli_stmt_bind_param($buscarProducto, 'i', $idProducto);
                if (!mysqli_stmt_execute($buscarProducto)) throw new RuntimeException('No se pudo consultar un producto');
                $producto = mysqli_stmt_get_result($buscarProducto)->fetch_assoc();
                if (!$producto) throw new RuntimeException('Uno de los productos ya no está disponible');

                $selecciones = [];
                foreach (($item['toppings'] ?? []) as $toppingSeleccionado) {
                    $idTopping = filter_var($toppingSeleccionado['id'] ?? null, FILTER_VALIDATE_INT);
                    $cantidadTopping = filter_var($toppingSeleccionado['cantidad'] ?? null, FILTER_VALIDATE_INT);
                    if ($idTopping === false || $idTopping < 1 || $cantidadTopping === false || $cantidadTopping < 1) {
                        throw new RuntimeException('Hay un topping inválido en el pedido');
                    }
                    $selecciones[$idTopping] = ($selecciones[$idTopping] ?? 0) + $cantidadTopping;
                }

                $porcionesTopping = array_sum($selecciones);
                if ($porcionesTopping > (int) $producto['topping']) {
                    throw new RuntimeException('La cantidad de toppings supera el máximo permitido para ' . $producto['nombre']);
                }

                $precioProducto = (float) $producto['valor'];
                $precioToppings = 0;
                $toppingsActuales = [];
                foreach ($selecciones as $idTopping => $cantidadTopping) {
                    mysqli_stmt_bind_param($buscarTopping, 'i', $idTopping);
                    if (!mysqli_stmt_execute($buscarTopping)) throw new RuntimeException('No se pudo consultar un topping');
                    $toppingActual = mysqli_stmt_get_result($buscarTopping)->fetch_assoc();
                    if (!$toppingActual) throw new RuntimeException('Uno de los toppings ya no está disponible');
                    $toppingActual['cantidad'] = $cantidadTopping;
                    $precioToppings += (float) $toppingActual['precio'] * $cantidadTopping;
                    $toppingsActuales[] = $toppingActual;
                }

                $subtotal = ($precioProducto + $precioToppings) * $cantidadProducto;
                $nombreProducto = $producto['nombre'];
                mysqli_stmt_bind_param($insertDetalle, 'iisdid', $idPedido, $idProducto, $nombreProducto, $precioProducto, $cantidadProducto, $subtotal);
                if (!mysqli_stmt_execute($insertDetalle)) throw new RuntimeException('No se pudo guardar un producto del pedido');
                $idDetalle = mysqli_insert_id($conn);

                foreach ($toppingsActuales as $toppingActual) {
                    $idTopping = (int) $toppingActual['id'];
                    $nombreTopping = $toppingActual['nombre'];
                    $precioTopping = (float) $toppingActual['precio'];
                    $cantidadTopping = (int) $toppingActual['cantidad'];
                    $subtotalTopping = $precioTopping * $cantidadTopping * $cantidadProducto;
                    mysqli_stmt_bind_param($insertDetalleTopping, 'iisdid', $idDetalle, $idTopping, $nombreTopping, $precioTopping, $cantidadTopping, $subtotalTopping);
                    if (!mysqli_stmt_execute($insertDetalleTopping)) throw new RuntimeException('No se pudo guardar un topping del pedido');
                }

                $totalPedido += $subtotal;
                $cantidadItems++;
            }

            if ($cantidadItems === 0) throw new RuntimeException('El pedido no contiene productos');

            $actualizarPedido = mysqli_prepare($conn, "UPDATE pedidos SET total = ? WHERE id = ?");
            if (!$actualizarPedido) throw new RuntimeException('No se pudo calcular el total del pedido');
            mysqli_stmt_bind_param($actualizarPedido, 'di', $totalPedido, $idPedido);
            if (!mysqli_stmt_execute($actualizarPedido)) throw new RuntimeException('No se pudo actualizar el total del pedido');

            mysqli_commit($conn);
            return ['id' => $idPedido, 'codigo_seguimiento' => $codigoSeguimiento];
        } catch (\Throwable $th) {
            mysqli_rollback($conn);
            error_log('Error al guardar pedido: ' . $th->getMessage());
            return false;
        }
    }

    static public function pedidos($codigoSeguimiento = null){
        try {
            $conn = SingletonConexion::getInstance()->getConnection();
            $filtroCodigo = $codigoSeguimiento === null ? '' : 'WHERE pe.codigo_seguimiento = ?';
            $query = "SELECT pe.id AS pedido_id, pe.codigo_seguimiento, pe.fecha_entrega, pe.contacto, pe.direccion,
                pe.observacion, pe.total, pe.estado, pe.fecha_alta,
                pd.id AS detalle_id, pd.id_producto, pd.producto_nombre,
                pd.precio_unitario AS producto_precio, pd.cantidad AS producto_cantidad,
                pd.subtotal AS producto_subtotal,
                pdt.id AS detalle_topping_id, pdt.id_topping, pdt.topping_nombre,
                pdt.precio_unitario AS topping_precio, pdt.cantidad_por_producto AS topping_cantidad,
                pdt.subtotal AS topping_subtotal
                FROM pedidos pe
                LEFT JOIN pedido_detalles pd ON pd.id_pedido = pe.id
                LEFT JOIN pedido_detalle_toppings pdt ON pdt.id_pedido_detalle = pd.id
                $filtroCodigo
                ORDER BY pe.fecha_alta DESC, pe.id DESC, pd.id ASC, pdt.id ASC";
            if ($codigoSeguimiento === null) {
                $result = mysqli_query($conn, $query);
            } else {
                $stmt = mysqli_prepare($conn, $query);
                if (!$stmt) return false;
                mysqli_stmt_bind_param($stmt, 's', $codigoSeguimiento);
                if (!mysqli_stmt_execute($stmt)) return false;
                $result = mysqli_stmt_get_result($stmt);
            }
            if (!$result) return [];

            $pedidos = [];
            while ($row = $result->fetch_assoc()) {
                $idPedido = (int) $row['pedido_id'];
                if (!isset($pedidos[$idPedido])) {
                    $pedidos[$idPedido] = [
                        'id' => $idPedido,
                        'codigo_seguimiento' => $row['codigo_seguimiento'],
                        'fecha_entrega' => $row['fecha_entrega'],
                        'contacto' => $row['contacto'],
                        'direccion' => $row['direccion'],
                        'observacion' => $row['observacion'],
                        'total' => (float) $row['total'],
                        'estado' => $row['estado'],
                        'fecha_alta' => $row['fecha_alta'],
                        'productos' => []
                    ];
                }

                if ($row['detalle_id'] === null) continue;
                $idDetalle = (int) $row['detalle_id'];
                if (!isset($pedidos[$idPedido]['productos'][$idDetalle])) {
                    $pedidos[$idPedido]['productos'][$idDetalle] = [
                        'id_producto' => $row['id_producto'] === null ? null : (int) $row['id_producto'],
                        'nombre' => $row['producto_nombre'],
                        'precio' => (float) $row['producto_precio'],
                        'cantidad' => (int) $row['producto_cantidad'],
                        'subtotal' => (float) $row['producto_subtotal'],
                        'toppings' => []
                    ];
                }

                if ($row['detalle_topping_id'] !== null) {
                    $pedidos[$idPedido]['productos'][$idDetalle]['toppings'][] = [
                        'id_topping' => $row['id_topping'] === null ? null : (int) $row['id_topping'],
                        'nombre' => $row['topping_nombre'],
                        'precio' => (float) $row['topping_precio'],
                        'cantidad' => (int) $row['topping_cantidad'],
                        'subtotal' => (float) $row['topping_subtotal']
                    ];
                }
            }

            foreach ($pedidos as &$pedido) {
                $pedido['productos'] = array_values($pedido['productos']);
            }
            unset($pedido);
            return array_values($pedidos);
        } catch (\Throwable $th) {
            return [];
        }
    }

    static public function pedido_por_codigo($codigoSeguimiento){
        $pedidos = self::pedidos($codigoSeguimiento);
        if (!is_array($pedidos) || !$pedidos) return false;

        $pedido = $pedidos[0];
        unset($pedido['contacto'], $pedido['direccion']);
        return $pedido;
    }

    static public function actualizar_estado_pedido($id, $estado){
        $estadosPermitidos = ['pendiente', 'en_preparacion', 'listo', 'entregado', 'cancelado'];
        if (!in_array($estado, $estadosPermitidos, true)) return false;

        try {
            $conn = SingletonConexion::getInstance()->getConnection();
            $stmt = mysqli_prepare($conn, "UPDATE pedidos SET estado = ? WHERE id = ?");
            if (!$stmt) return false;

            $id = (int) $id;
            mysqli_stmt_bind_param($stmt, 'si', $estado, $id);
            return mysqli_stmt_execute($stmt);
        } catch (\Throwable $th) {
            return false;
        }
    }

    static public function cargar_producto($nombre, $descripcion, $categoria, $tag, $precio, $topping){
        try {
            $conn = SingletonConexion::getInstance()->getConnection();

            $query = "INSERT INTO productos (nombre, descripcion, categoria, tag, valor, topping, fecha_alta, ultima_mod)
            VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())";
            $stmt = mysqli_prepare($conn, $query);

            if (!$stmt) return false;
            
            $precio = (float) $precio;
            $topping = (int) $topping;
            mysqli_stmt_bind_param($stmt, 'ssssdi', $nombre, $descripcion, $categoria, $tag, $precio, $topping);

            if (!mysqli_stmt_execute($stmt)) return false;

            return mysqli_insert_id($conn);
        } catch (\Throwable $th) {
            echo $th->getMessage();
            return false;
        }
    }

    static public function actualizar_producto($id_producto, $nombre, $descripcion, $categoria, $tag, $precio, $topping){
        try {
            $conn = SingletonConexion::getInstance()->getConnection();

            $query = "UPDATE productos SET nombre = ?, descripcion = ?, categoria = ?, tag = ?, valor = ?, topping = ?, ultima_mod = NOW() WHERE id = ?";
            $stmt = mysqli_prepare($conn, $query);

            if (!$stmt) return false;
            
            $precio = (float) $precio;
            $topping = (int) $topping;
            mysqli_stmt_bind_param($stmt, 'ssssdii', $nombre, $descripcion, $categoria, $tag, $precio, $topping, $id_producto);

            if (!mysqli_stmt_execute($stmt)) return false;

            return true;
        } catch (\Throwable $th) {
            echo $th->getMessage();
            return false;
        }
    }

    static public function cargar_categoria($nombre){
        try {
            $conn = SingletonConexion::getInstance()->getConnection();

            $query = "INSERT INTO categoria (nombre) VALUES (?)";
            $stmt = mysqli_prepare($conn, $query);

            if (!$stmt) return false;
            
            mysqli_stmt_bind_param($stmt, 's', $nombre);

            if (!mysqli_stmt_execute($stmt)) return false;

            return mysqli_insert_id($conn);
        } catch (\Throwable $th) {
            echo $th->getMessage();
            return false;
        }
    }

    static public function cargar_imagen($id_producto){
        try {
            $conn = SingletonConexion::getInstance()->getConnection();

            $query = "INSERT INTO imagenes (id_producto, nombre) VALUES (?, '')";
            $stmt = mysqli_prepare($conn, $query);

            if (!$stmt) return false;
            
            mysqli_stmt_bind_param($stmt, 'i', $id_producto);

            if (!mysqli_stmt_execute($stmt)) return false;

            return mysqli_insert_id($conn);
        } catch (\Throwable $th) {
            echo $th->getMessage();
            return false;
        }
    }

    static public function actualizar_nombre_imagen($id_imagen, $nombre){
        $conn = SingletonConexion::getInstance()->getConnection();
        $stmt = mysqli_prepare($conn, "UPDATE imagenes SET nombre = ? WHERE id = ?");
        if (!$stmt) return false;

        mysqli_stmt_bind_param($stmt, 'si', $nombre, $id_imagen);
        return mysqli_stmt_execute($stmt);
    }

    static public function eliminar_producto($id_producto, $esCategoria = false, $esImagen = false){
        try {
            $conn = SingletonConexion::getInstance()->getConnection();

            $carpetaProductos = __DIR__ . '/../img/productos';
            $carpetaProducto = null;

            if ($esImagen) {
                $consultaImagen = mysqli_prepare($conn, "SELECT id_producto, nombre FROM imagenes WHERE id = ?");
                if (!$consultaImagen) return false;

                mysqli_stmt_bind_param($consultaImagen, 'i', $id_producto);
                if (!mysqli_stmt_execute($consultaImagen)) return false;

                $imagen = mysqli_stmt_get_result($consultaImagen)->fetch_assoc();
                if (!$imagen) return false;

                $carpetaProducto = $carpetaProductos . DIRECTORY_SEPARATOR . (int) $imagen['id_producto'];
                if (!empty($imagen['nombre'])) {
                    $rutaArchivo = $carpetaProducto . DIRECTORY_SEPARATOR . basename($imagen['nombre']);
                    if (is_file($rutaArchivo)) {
                        unlink($rutaArchivo);
                    }
                }
                $query = "DELETE FROM imagenes WHERE id = ?";
            } elseif ($esCategoria) {
                $query = "DELETE FROM categoria WHERE id = ?";
            } else {
                $carpetaProducto = $carpetaProductos . DIRECTORY_SEPARATOR . (int) $id_producto;
                if (is_dir($carpetaProducto)) {
                    $archivos = scandir($carpetaProducto);
                    if ($archivos !== false) {
                        foreach ($archivos as $archivo) {
                            if ($archivo === '.' || $archivo === '..') continue;
                            $rutaArchivo = $carpetaProducto . DIRECTORY_SEPARATOR . $archivo;
                            if (is_file($rutaArchivo)) unlink($rutaArchivo);
                        }
                        rmdir($carpetaProducto);
                    }
                }
                $stmt = mysqli_prepare($conn, "DELETE FROM imagenes WHERE id_producto = ?");
                if (!$stmt) return false;

                mysqli_stmt_bind_param($stmt, 'i', $id_producto);
                if (!mysqli_stmt_execute($stmt)) return false;
                $query = "DELETE FROM productos WHERE id = ?";
            }

            $stmt = mysqli_prepare($conn, $query);

            if (!$stmt) return false;
            
            mysqli_stmt_bind_param($stmt, 'i', $id_producto);

            if (!mysqli_stmt_execute($stmt)) return false;

            $filasAfectadas = mysqli_affected_rows($conn);

            return $filasAfectadas;
        } catch (\Throwable $th) {
            echo $th->getMessage();
            return false;
        }
    }    
}
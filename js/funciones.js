alertify.defaults.glossary.ok = 'Si'
alertify.defaults.glossary.cancel = 'No'
function initializeMenu() {
    if (!window.matchMedia('(max-width: 800px)').matches) return

    const menuToggle = document.querySelector('.menu-toggle')
    const navigation = document.querySelector('#main-navigation')
    const backdrop = document.querySelector('.menu-backdrop')
    const closeButton = document.querySelector('.menu-close')

    if (!menuToggle || !navigation || !backdrop) return

    function closeMenu() {
        navigation.classList.remove('is-open')
        backdrop.classList.remove('is-visible')
        menuToggle.setAttribute('aria-expanded', 'false')
        menuToggle.setAttribute('aria-label', 'Abrir menú')
        document.body.classList.remove('menu-open')
        navigation.style.pointerEvents = 'none'
    }

    menuToggle.addEventListener('click', () => {
        const isOpen = navigation.classList.toggle('is-open')
        backdrop.classList.toggle('is-visible', isOpen)
        menuToggle.setAttribute('aria-expanded', String(isOpen))
        menuToggle.setAttribute('aria-label', isOpen ? 'Cerrar menú' : 'Abrir menú')
        document.body.classList.toggle('menu-open', isOpen)
        navigation.style.pointerEvents = isOpen ? 'auto' : 'none'
    })
    backdrop.addEventListener('click', closeMenu)
    if (closeButton) closeButton.addEventListener('click', closeMenu)
    navigation.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu))
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') closeMenu()
    })
}

function initializeCart() {
    const cartButton = document.querySelector('.cart-btn')
    const cartPanel = document.querySelector('#tienda_carrito')
    const cartOverlay = document.querySelector('.cart-overlay')
    const cartCloseButtons = document.querySelectorAll('[data-cart-close]')
    const cartSubmit = document.querySelector('#cart-submit')
    const deliveryDateInput = document.querySelector('#cart-delivery-date')

    if (!cartButton || !cartPanel || !cartOverlay) return
    cartSubmit?.addEventListener('click', cargarPedido)

    if (deliveryDateInput) {
        const minimumDate = new Date(Date.now() + 72 * 60 * 60 * 1000)
        if (minimumDate.getHours() || minimumDate.getMinutes() || minimumDate.getSeconds() || minimumDate.getMilliseconds()) {
            minimumDate.setDate(minimumDate.getDate() + 1)
        }
        minimumDate.setHours(0, 0, 0, 0)
        deliveryDateInput.min = [
            minimumDate.getFullYear(),
            String(minimumDate.getMonth() + 1).padStart(2, '0'),
            String(minimumDate.getDate()).padStart(2, '0')
        ].join('-')
    }

    function closeCart() {
        cartPanel.classList.remove('is-visible')
        cartPanel.setAttribute('aria-hidden', 'true')
        cartOverlay.classList.remove('is-visible')
        cartButton.setAttribute('aria-expanded', 'false')
        document.body.classList.remove('cart-open')

    }

    function openCart() {
        cartPanel.classList.add('is-visible')
        cartPanel.setAttribute('aria-hidden', 'false')
        cartOverlay.classList.add('is-visible')
        cartButton.setAttribute('aria-expanded', 'true')
        document.body.classList.add('cart-open')
    }

    window.abrirCarrito = openCart

    cartButton.addEventListener('click', () => {
        const isOpen = cartPanel.classList.contains('is-visible')
        if (isOpen) {
            closeCart()
            return
        }
        openCart()
    })

    cartCloseButtons.forEach((button) => button.addEventListener('click', closeCart))

    cartOverlay.addEventListener('click', closeCart)

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && cartPanel.classList.contains('is-visible')) closeCart()
    })
}

function initializeProductModal() {
    const productContainer = document.querySelector('#product-grid, #product-table-body')
    const modal = document.querySelector('#product-modal')
    const modalImage = document.querySelector('#product-modal-image')
    const imageCount = document.querySelector('#product-modal-image-count')
    const modalTitle = document.querySelector('#product-modal-title')
    const modalDescription = document.querySelector('#product-modal-description')
    const modalPrice = document.querySelector('#product-modal-price')
    const toppingBuilder = document.querySelector('#topping-builder')
    const closeButton = document.querySelector('[data-product-modal-close]')
    const addButton = document.querySelector('#product-modal-add')
    const shareButton = document.querySelector('#product-modal-share')
    const previousButton = document.querySelector('.product-modal-arrow-prev')
    const nextButton = document.querySelector('.product-modal-arrow-next')

    if (!productContainer || !modal || !modalImage || !modalTitle || !modalDescription || !modalPrice || !closeButton || !addButton || !shareButton || !previousButton || !nextButton) return

    let selectedProductId = ''
    let productImages = []
    let currentImageIndex = 0

    function updateModalImage() {
        if (!productImages.length) return
        modalImage.src = `/tempus.focacceria/${productImages[currentImageIndex]}`
        previousButton.hidden = productImages.length < 2
        nextButton.hidden = productImages.length < 2
        if (imageCount) {
            imageCount.hidden = false
            imageCount.textContent = `${currentImageIndex + 1}/${productImages.length}`
        }
    }

    function closeModal() {
        modal.classList.remove('is-visible')
        modal.setAttribute('aria-hidden', 'true')
        document.body.classList.remove('product-modal-open')

        const url = new URL(window.location.href)
        if (url.searchParams.has('id')) {
            url.searchParams.delete('id')
            window.history.replaceState({}, document.title, `${url.pathname}${url.search}${url.hash}`)
        }
    }

    function openModal(card) {
        const image = card.querySelector('.product-photo img, .product-thumb')
        const title = card.querySelector('.product-info h3, strong')
        const description = card.querySelector('.product-info p, small')
        const price = card.querySelector('.product-info .price, td:nth-child(2)')

        if (!image || !title || !description || !price) return

        modalImage.src = image.src
        modalImage.alt = image.alt
        modalTitle.textContent = title.textContent
        modalDescription.textContent = description.textContent
        modalPrice.textContent = price.textContent
        const toppingLimit = Math.max(0, Math.floor(Number(card.dataset.toppingLimit) || 0))
        modal.dataset.toppingLimit = String(toppingLimit)
        if (toppingBuilder) {
            const productDetails = `${title.textContent} ${description.textContent} ${card.dataset.category || ''}`.toLowerCase()
            toppingBuilder.hidden = !productDetails.includes('focac') || toppingLimit === 0 || OPCIONES_TOPPING.length === 0
            const toppingLimitNote = toppingBuilder.querySelector('#topping-limit-note')
            if (toppingLimitNote) toppingLimitNote.textContent = `Podés elegir hasta ${toppingLimit} porciones en total.`
        }
        selectedProductId = card.dataset.productId || ''
        productImages = [image.getAttribute('src').replace('/tempus.focacceria/', '')]
        currentImageIndex = 0
        updateModalImage()
        modal.classList.add('is-visible')
        modal.setAttribute('aria-hidden', 'false')
        document.body.classList.add('product-modal-open')
        closeButton.focus()

        const datosPost = new FormData()
        datosPost.append('imagenesProducto', true)
        datosPost.append('id', selectedProductId)
        fetch('/tempus.focacceria/ajax/datos_productos.php', { method: 'POST', body: datosPost })
            .then(response => response.json())
            .then(json => {
                if (json.error || !json.resp.length) return
                productImages = json.resp.map(item => item.imagen_ruta)
                currentImageIndex = 0
                updateModalImage()
            })
            .catch(error => console.error('Error al cargar imágenes:', error))
    }

    window.abrirModalProductoPorId = (id) => {
        const product = Array.from(productContainer.querySelectorAll('[data-product-id]'))
            .find((item) => String(item.dataset.productId) === String(id))
        if (product) openModal(product)
    }

    productContainer.addEventListener('click', (event) => {
        const productImage = event.target.closest('.product-photo img, .product-thumb')
        if (!productImage) return
        openModal(event.target.closest('.product-card, tr'))
    })
    closeButton.addEventListener('click', closeModal)
    previousButton.addEventListener('click', () => {
        if (productImages.length < 2) return
        currentImageIndex = (currentImageIndex - 1 + productImages.length) % productImages.length
        updateModalImage()
    })
    nextButton.addEventListener('click', () => {
        if (productImages.length < 2) return
        currentImageIndex = (currentImageIndex + 1) % productImages.length
        updateModalImage()
    })
    addButton.addEventListener('click', () => {
        if (!selectedProductId) return
        const selectedToppings = Array.from(toppingBuilder?.querySelectorAll('[data-topping-item]') || [])
            .map((item) => ({
                ...OPCIONES_TOPPING.find(topping => topping.id === item.dataset.toppingId),
                cantidad: Number(item.querySelector('[data-topping-count]').textContent) || 0
            }))
            .filter(topping => topping.cantidad > 0)
        cargarCarrito(selectedProductId, selectedToppings)
        closeModal()
    })
    shareButton.addEventListener('click', () => {
        compartirProducto(selectedProductId, modalTitle.textContent, modalPrice.textContent)
    })
    modal.addEventListener('click', (event) => {
        if (event.target === modal) closeModal()
    })
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && modal.classList.contains('is-visible')) closeModal()
    })
}

function initializeStore() {
    const filterButtons = document.querySelectorAll('.filter-btn')
    const productCards = document.querySelectorAll('.product-card')
    const searchInput = document.querySelector('#search')
    const cartCount = document.querySelector('.cart-count')
    let selectedFilter = 'todos'
    let cartItems = 0

    if (!searchInput) return

    function updateProducts() {
        const query = searchInput.value.toLowerCase().trim()
        let visibleProducts = 0
        productCards.forEach((card) => {
            const matchesFilter = selectedFilter === 'todos' || card.dataset.category.includes(selectedFilter)
            const matchesSearch = card.dataset.name.toLowerCase().includes(query)
            const visible = matchesFilter && matchesSearch
            card.style.display = visible ? '' : 'none'
            if (visible) visibleProducts += 1
        })
    }

    filterButtons.forEach((button) => button.addEventListener('click', () => {
        filterButtons.forEach((item) => item.classList.remove('active'))
        button.classList.add('active')
        const detalle = Array.from(carrito.values())
            .map(item => {
                const toppings = item.toppings?.length
                    ? ` (Toppings: ${item.toppings.map(topping => `${topping.nombre} x${topping.cantidad}`).join(', ')})`
                    : ''
                return `- ${item.cantidad} x ${item.nombre}${toppings} — $${formatearPrecio(item.precio * item.cantidad)}`
            })
        if (cartCount) cartCount.textContent = cartItems
    }))
}

function initializeProductManagerSearch() {
    const searchInput = document.querySelector('#product-search')
    const productTableBody = document.querySelector('#product-table-body')
    const productCount = document.querySelector('#product-count')

    if (!searchInput || !productTableBody) return

    function filterProducts() {
        const query = searchInput.value.toLowerCase().trim()
        const rows = Array.from(productTableBody.querySelectorAll('tr'))
        let visibleProducts = 0

        rows.forEach((row) => {
            const matches = row.textContent.toLowerCase().includes(query)
            row.hidden = !matches
            if (matches) visibleProducts += 1
        })

        if (productCount) productCount.textContent = `${visibleProducts} de ${rows.length} productos`
    }

    searchInput.addEventListener('input', filterProducts)
    new MutationObserver(filterProducts).observe(productTableBody, { childList: true })
}

function initializeOrderManagement() {
    const tabs = Array.from(document.querySelectorAll('[data-admin-tab]'))
    const catalogPanel = document.querySelector('#catalog-panel')
    const ordersPanel = document.querySelector('#orders-panel')
    const ordersBody = document.querySelector('#orders-table-body')
    const refreshButton = document.querySelector('#orders-refresh')
    if (!tabs.length || !catalogPanel || !ordersPanel || !ordersBody) return

    const estados = [
        ['pendiente', 'Pendiente'],
        ['en_preparacion', 'En preparación'],
        ['listo', 'Listo'],
        ['entregado', 'Entregado'],
        ['cancelado', 'Cancelado']
    ]

    function appendCell(row, content, className = '') {
        const cell = document.createElement('td')
        if (className) cell.className = className
        if (content instanceof Node) cell.append(content)
        else cell.textContent = content ?? ''
        row.append(cell)
        return cell
    }

    function renderOrders(pedidos) {
        ordersBody.replaceChildren()
        if (!pedidos.length) {
            const row = document.createElement('tr')
            const cell = document.createElement('td')
            cell.colSpan = 8
            cell.className = 'table-empty'
            cell.textContent = 'Todavía no hay pedidos cargados.'
            row.append(cell)
            ordersBody.append(row)
            return
        }

        pedidos.forEach((pedido) => {
            const row = document.createElement('tr')
            // appendCell(row, `#${pedido.id}`)
            appendCell(row, pedido.codigo_seguimiento)
            const [year, month, day] = String(pedido.fecha_entrega).split('-')
            appendCell(row, year && month && day ? `${day}/${month}/${year}` : pedido.fecha_entrega)

            const contact = document.createElement('div')
            const contactName = document.createElement('strong')
            contactName.textContent = pedido.contacto
            const address = document.createElement('small')
            address.textContent = pedido.direccion
            contact.append(contactName, address)
            appendCell(row, contact)

            const details = document.createElement('div')
            details.className = 'order-lines'
            ;(pedido.productos || []).forEach((producto) => {
                const line = document.createElement('div')
                const productName = document.createElement('strong')
                productName.textContent = `${producto.cantidad} × ${producto.nombre}`
                line.append(productName)
                if (producto.toppings?.length) {
                    const toppings = document.createElement('small')
                    toppings.textContent = producto.toppings
                        .map(topping => `${topping.nombre} ×${topping.cantidad}`)
                        .join(', ')
                    line.append(toppings)
                }
                details.append(line)
            })
            if (pedido.observacion) {
                const observation = document.createElement('small')
                observation.className = 'order-observation'
                observation.textContent = `Obs.: ${pedido.observacion}`
                details.append(observation)
            }
            appendCell(row, details)
            appendCell(row, `$${formatearPrecio(pedido.total)}`)

            const stateSelect = document.createElement('select')
            stateSelect.className = 'order-state-select'
            stateSelect.setAttribute('aria-label', `Estado del pedido ${pedido.id}`)
            estados.forEach(([value, label]) => {
                const option = document.createElement('option')
                option.value = value
                option.textContent = label
                stateSelect.append(option)
            })
            stateSelect.value = pedido.estado
            stateSelect.dataset.currentState = pedido.estado
            stateSelect.addEventListener('change', () => actualizarEstadoPedido(pedido.id, stateSelect))
            appendCell(row, stateSelect)
            ordersBody.append(row)
        })
    }

    function cargarPedidos() {
        ordersBody.replaceChildren()
        const loadingRow = document.createElement('tr')
        const loadingCell = document.createElement('td')
        loadingCell.colSpan = 8
        loadingCell.className = 'table-empty'
        loadingCell.textContent = 'Cargando pedidos…'
        loadingRow.append(loadingCell)
        ordersBody.append(loadingRow)

        const data = new FormData()
        data.append('listarPedidos', '1')
        fetch('/tempus.focacceria/ajax/gestionar_pedidos.php', { method: 'POST', body: data })
            .then(response => response.json())
            .then((json) => {
                if (json.error) throw new Error(json.error)
                renderOrders(Array.isArray(json.resp) ? json.resp : [])
            })
            .catch((error) => {
                renderOrders([])
                alertify.error(error.message || 'No se pudieron cargar los pedidos')
            })
    }

    function actualizarEstadoPedido(id, select) {
        const estadoAnterior = select.dataset.currentState
        const data = new FormData()
        data.append('actualizarEstadoPedido', '1')
        data.append('id', String(id))
        data.append('estado', select.value)
        select.disabled = true

        fetch('/tempus.focacceria/ajax/gestionar_pedidos.php', { method: 'POST', body: data })
            .then(response => response.json())
            .then((json) => {
                if (json.error) throw new Error(json.error)
                select.dataset.currentState = select.value
                alertify.success(`Pedido #${id}: ${select.options[select.selectedIndex].text}`)
            })
            .catch((error) => {
                select.value = estadoAnterior
                alertify.error(error.message || 'No se pudo actualizar el estado')
            })
            .finally(() => { select.disabled = false })
    }

    tabs.forEach((tab) => tab.addEventListener('click', () => {
        const showOrders = tab.dataset.adminTab === 'orders'
        catalogPanel.hidden = showOrders
        ordersPanel.hidden = !showOrders
        tabs.forEach((item) => {
            const isActive = item === tab
            item.classList.toggle('is-active', isActive)
            item.setAttribute('aria-selected', String(isActive))
        })
        if (showOrders) cargarPedidos()
    }))

    refreshButton?.addEventListener('click', cargarPedidos)
}

function initializeOrderTracking() {
    const form = document.querySelector('#order-tracking-form')
    const codeInput = document.querySelector('#tracking-code')
    const result = document.querySelector('#order-tracking-result')
    const submitButton = form?.querySelector('[type="submit"]')
    if (!form || !codeInput || !result) return

    const estados = {
        pendiente: 'Pendiente',
        en_preparacion: 'En preparación',
        listo: 'Listo',
        entregado: 'Entregado',
        cancelado: 'Cancelado'
    }

    function showMessage(message, isError = false) {
        result.replaceChildren()
        const text = document.createElement('p')
        text.className = isError ? 'order-tracking-message is-error' : 'order-tracking-message'
        text.textContent = message
        result.append(text)
        result.hidden = false
    }

    function renderOrder(order) {
        result.replaceChildren()
        const card = document.createElement('article')
        card.className = 'order-status-card'

        const heading = document.createElement('div')
        heading.className = 'order-status-heading'
        const title = document.createElement('h3')
        title.textContent = `Pedido ${order.codigo_seguimiento}`
        const status = document.createElement('span')
        status.className = `order-status-badge is-${order.estado}`
        status.textContent = estados[order.estado] || order.estado
        heading.append(title, status)
        card.append(heading)

        const meta = document.createElement('p')
        const [year, month, day] = String(order.fecha_entrega).split('-')
        meta.className = 'order-status-meta'
        meta.textContent = `Entrega: ${year && month && day ? `${day}/${month}/${year}` : order.fecha_entrega} · Total: $${formatearPrecio(order.total)}`
        card.append(meta)

        const productList = document.createElement('ul')
        productList.className = 'order-status-products'
        ;(order.productos || []).forEach((product) => {
            const row = document.createElement('li')
            const productName = document.createElement('strong')
            productName.textContent = `${product.cantidad} × ${product.nombre} — $${formatearPrecio(product.subtotal)}`
            row.append(productName)
            if (product.toppings?.length) {
                const toppings = document.createElement('small')
                toppings.textContent = product.toppings
                    .map(topping => `${topping.nombre} ×${topping.cantidad}`)
                    .join(', ')
                row.append(toppings)
            }
            productList.append(row)
        })
        card.append(productList)

        if (order.observacion) {
            const observation = document.createElement('p')
            observation.className = 'order-status-observation'
            observation.textContent = `Observación: ${order.observacion}`
            card.append(observation)
        }

        result.append(card)
        result.hidden = false
    }

    form.addEventListener('submit', (event) => {
        event.preventDefault()
        if (!form.reportValidity()) return

        const data = new FormData()
        data.append('codigo', codeInput.value.trim().toUpperCase())
        if (submitButton) submitButton.disabled = true
        showMessage('Buscando el pedido…')

        fetch('/tempus.focacceria/ajax/consultar_pedido.php', { method: 'POST', body: data })
            .then(response => response.json())
            .then((json) => {
                if (json.error) throw new Error(json.error)
                renderOrder(json.resp)
            })
            .catch((error) => showMessage(error.message || 'No se pudo consultar el pedido.', true))
            .finally(() => { if (submitButton) submitButton.disabled = false })
    })
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initializeMenu()
        initializeCart()
        initializeProductModal()
        initializeStore()
        initializeProductManagerSearch()
        initializeOrderManagement()
        initializeOrderTracking()
        initializeToppingPreview()
    })
} else {
    initializeMenu()
    initializeCart()
    initializeProductModal()
    initializeStore()
    initializeProductManagerSearch()
    initializeOrderManagement()
    initializeOrderTracking()
    initializeToppingPreview()
}
datosProductos()
let OPCIONES_TOPPING = []
const carrito = new Map()

function renderizarCarrito() {
    const carritoBody = document.querySelector('#carrito-table-body')
    const cartCount = document.querySelector('#cart-count')
    const cartTotal = document.querySelector('#cart-total')
    const cartSubmit = document.querySelector('#cart-submit')

    if (!carritoBody) return

    let totalUnidades = 0
    let totalCompra = 0
    let datos = ''

    carrito.forEach((item, cartKey) => {
        totalUnidades += item.cantidad
        totalCompra += item.cantidad * item.precio
        const imagenProducto = item.imagen_ruta
            ? `<img class="product-thumb" src="/tempus.focacceria/${item.imagen_ruta}" alt="${item.nombre}" loading="lazy" />`
            : '<span class="product-thumb no-image"></span>'
        const toppings = item.toppings?.length
            ? `<small class="cart-item-toppings">Toppings: ${item.toppings.map(topping => `${topping.nombre} ×${topping.cantidad} (+$${formatearPrecio(topping.precio * topping.cantidad)})`).join(', ')}</small>`
            : ''
        const encodedCartKey = encodeURIComponent(cartKey)

        datos += `<tr>
                    <td><div class="product-cell">${imagenProducto}<div><strong>${item.nombre}</strong><small>${item.descripcion}</small>${toppings}</div></div></td>
                    <td>$${formatearPrecio(item.precio)}
                    <div class="quantity-control" aria-label="Cantidad de ${item.nombre}">
                        <button type="button" class="quantity-btn" data-cart-action="decrease" data-cart-key="${encodedCartKey}" aria-label="Quitar una unidad">−</button>
                        <span>${item.cantidad}</span>
                        <button type="button" class="quantity-btn" data-cart-action="increase" data-cart-key="${encodedCartKey}" aria-label="Agregar una unidad">+</button>
                    </div></td>
                </tr>`
    })

    carritoBody.innerHTML = datos
    if (cartCount) cartCount.textContent = totalUnidades
    if (cartTotal) cartTotal.textContent = `$${formatearPrecio(totalCompra)}`
    if (cartSubmit) cartSubmit.disabled = carrito.size === 0
}

function cargarPedido() {
    if (!carrito.size) return

    const contactInput = document.querySelector('#cart-contact')
    const deliveryDateInput = document.querySelector('#cart-delivery-date')
    const deliveryAddressInput = document.querySelector('#cart-delivery-address')
    const observationInput = document.querySelector('#cart-order-observation')

    if (!contactInput?.value.trim()) {
        contactInput?.focus()
        alertify.error('Ingresá un nombre y teléfono de contacto')
        return
    }
    if (!deliveryDateInput?.reportValidity()) {
        return
    }
    if (!deliveryAddressInput?.value.trim()) {
        deliveryAddressInput?.focus()
        alertify.error('Ingresá la dirección de entrega')
        return
    }

    const datosPedido = new FormData()
    datosPedido.append('pedido', JSON.stringify({
        fecha_entrega: deliveryDateInput.value,
        contacto: contactInput.value.trim(),
        direccion: deliveryAddressInput.value.trim(),
        observacion: observationInput?.value.trim() || '',
        productos: Array.from(carrito.values()).map((item) => ({
            id: item.id,
            cantidad: item.cantidad,
            toppings: (item.toppings || []).map(topping => ({ id: topping.id, cantidad: topping.cantidad }))
        }))
    }))

    alertify.confirm('Carga de pedido', '\u00BFSeguro quiere cargar el pedido?', function(){
        const cartSubmit = document.querySelector('#cart-submit')
        if (cartSubmit) cartSubmit.disabled = true

        fetch('/tempus.focacceria/ajax/cargar_pedido.php', { method: 'POST', body: datosPedido })
            .then(response => response.json())
            .then((json) => {
                if (json.error) {
                    alertify.error(json.error)
                    return
                }

                carrito.clear()
                contactInput.value = ''
                deliveryDateInput.value = ''
                deliveryAddressInput.value = ''
                if (observationInput) observationInput.value = ''
                renderizarCarrito()
                const codigo = json.resp.codigo_seguimiento
                alertify.alert(
                    'Pedido cargado correctamente',
                    `Tu código de seguimiento es <strong>${codigo}</strong>. Guardalo para consultar el estado de tu pedido.`,
                    function () {
                        const trackingCodeInput = document.querySelector('#tracking-code')
                        if (!trackingCodeInput) return
                        trackingCodeInput.value = codigo
                        document.querySelector('#seguimiento')?.scrollIntoView({ behavior: 'smooth' })
                        trackingCodeInput.focus({ preventScroll: true })
                    }
                )
            })
            .catch((error) => {
                alertify.error('No se pudo guardar el pedido. Intentá nuevamente.')
                console.error('Error:', error)
            })
            .finally(() => {
                renderizarCarrito()
            })
    }, function(){})
}

document.addEventListener('click', (event) => {
    const button = event.target.closest('[data-cart-action]')
    if (!button) return

    const cartKey = decodeURIComponent(button.dataset.cartKey || '')
    const item = carrito.get(cartKey)
    if (!item) return

    if (button.dataset.cartAction === 'increase') item.cantidad += 1
    if (button.dataset.cartAction === 'decrease') {
        item.cantidad -= 1
        if (item.cantidad <= 0) carrito.delete(cartKey)
    }
    renderizarCarrito()
})

function formatearPrecio(valor) {
    const numero = Number(valor) || 0
    return numero.toLocaleString('es-AR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })
}

const PRODUCTOS_POR_PAGINA = 12
let productosActuales = []

function renderizarPaginacion(totalProductos, paginaActual) {
    const paginacion = document.querySelector('#product-pagination')
    if (!paginacion) return

    const totalPaginas = Math.max(1, Math.ceil(totalProductos / PRODUCTOS_POR_PAGINA))
    const pagina = Math.min(Math.max(1, Number(paginaActual) || 1), totalPaginas)

    let html = ''
    html += `<button type="button" class="pagination-btn" data-page="prev" ${pagina === 1 ? 'disabled' : ''} style="padding:8px 12px; border-radius:999px; border:1px solid #ddd; background:#fff; cursor:pointer;">Anterior</button>`

    for (let i = 1; i <= totalPaginas; i++) {
        html += `<button type="button" class="pagination-btn" data-page="${i}" ${i === pagina ? 'style="padding:8px 12px; border-radius:999px; border:1px solid #1f2937; background:#1f2937; color:#fff; cursor:pointer; width: 36px;"' : 'style="padding:8px 12px; border-radius:999px; border:1px solid #ddd; background:#fff; color:#1f2937; cursor:pointer; width: 36px;"'}>${i}</button>`
    }

    html += `<button type="button" class="pagination-btn" data-page="next" ${pagina === totalPaginas ? 'disabled' : ''} style="padding:8px 12px; border-radius:999px; border:1px solid #ddd; background:#fff; cursor:pointer;">Siguiente</button>`

    paginacion.innerHTML = html
    paginacion.querySelectorAll('.pagination-btn').forEach((boton) => {
        boton.addEventListener('click', function () {
            const accion = this.dataset.page
            let nuevaPagina = pagina

            if (accion === 'prev') nuevaPagina = pagina - 1
            if (accion === 'next') nuevaPagina = pagina + 1
            if (!isNaN(Number(accion))) nuevaPagina = Number(accion)

            const totalPaginasRender = Math.max(1, Math.ceil(productosActuales.length / PRODUCTOS_POR_PAGINA))
            nuevaPagina = Math.min(Math.max(1, nuevaPagina), totalPaginasRender)
            renderizarProductosDesdeLista(productosActuales, nuevaPagina)
        })
    })
}

function renderizarProductosDesdeLista(productos, paginaActual = 1) {
    const productGrid = document.querySelector('#product-grid')
    if (!productGrid) return

    productosActuales = Array.isArray(productos) ? productos : []
    const totalProductos = productosActuales.length
    const totalPaginas = Math.max(1, Math.ceil(totalProductos / PRODUCTOS_POR_PAGINA))
    const pagina = Math.min(Math.max(1, Number(paginaActual) || 1), totalPaginas)
    const inicio = (pagina - 1) * PRODUCTOS_POR_PAGINA
    const fin = inicio + PRODUCTOS_POR_PAGINA

    const productosPagina = productosActuales.slice(inicio, fin)
    const datos = productosPagina.map(element => {
        const item = element
        const tags = item.tag ? `<span class="tag">${item.tag}</span>` : ''
        const imagen = item.imagen_ruta ? `<img src="/tempus.focacceria/${item.imagen_ruta}" alt="${item.nombre}" loading="lazy" />`
            : '<div class="no-image">Sin imagen</div>'

        return `<article class="product-card" data-product-id="${item.id}" data-category="${item.categoria_nombre || ''}" data-topping-limit="${Number(item.topping) || 0}" data-name="${item.nombre}">
                    <div class="product-photo">${imagen}
                    ${tags}<i class="bi bi-cart-plus quick-add icon" onclick="cargarCarrito('${item.id}')"></i></div>
                    <div class="product-info"><div><h3>${item.nombre}</h3><p>${item.descripcion}</p></div><span class="price">$${formatearPrecio(item.valor)}</span></div>
                </article>`
    }).join('')

    productGrid.innerHTML = datos
    renderizarPaginacion(totalProductos, pagina)
    abrirModalProductoDesdeUrl()
}

function renderizarOpcionesTopping(toppings) {
    OPCIONES_TOPPING = Array.isArray(toppings) ? toppings.map((topping) => ({
        id: String(topping.id),
        nombre: String(topping.nombre),
        precio: Number(topping.precio) || 0
    })) : []

    const toppingList = document.querySelector('#topping-list')
    if (toppingList) {
        toppingList.replaceChildren()
        OPCIONES_TOPPING.forEach((topping) => {
            const item = document.createElement('div')
            item.className = 'topping-item'
            item.dataset.toppingItem = 'true'
            item.dataset.toppingId = topping.id
            item.dataset.toppingPrice = String(topping.precio)

            const description = document.createElement('div')
            description.className = 'topping-description'
            const name = document.createElement('strong')
            name.textContent = topping.nombre
            const price = document.createElement('span')
            price.textContent = `+$${topping.precio.toLocaleString('es-AR')} por porción`
            description.append(name, price)

            const stepper = document.createElement('div')
            stepper.className = 'topping-stepper'
            stepper.setAttribute('aria-label', `Cantidad de ${topping.nombre}`)

            const removeButton = document.createElement('button')
            removeButton.type = 'button'
            removeButton.dataset.toppingStep = 'remove'
            removeButton.setAttribute('aria-label', `Quitar una porción de ${topping.nombre}`)
            removeButton.textContent = '−'
            removeButton.disabled = true

            const count = document.createElement('output')
            count.dataset.toppingCount = 'true'
            count.setAttribute('aria-live', 'polite')
            count.textContent = '0'

            const addButton = document.createElement('button')
            addButton.type = 'button'
            addButton.dataset.toppingStep = 'add'
            addButton.setAttribute('aria-label', `Agregar una porción de ${topping.nombre}`)
            addButton.textContent = '+'

            stepper.append(removeButton, count, addButton)
            item.append(description, stepper)
            toppingList.append(item)
        })
    }

    const toppingTableBody = document.querySelector('#topping-table-body')
    if (toppingTableBody) {
        toppingTableBody.replaceChildren()
        OPCIONES_TOPPING.forEach((topping) => {
            const row = document.createElement('tr')
            const nameCell = document.createElement('td')
            const name = document.createElement('strong')
            name.textContent = topping.nombre
            nameCell.append(name)

            const priceCell = document.createElement('td')
            priceCell.textContent = `$${formatearPrecio(topping.precio)}`

            const actionCell = document.createElement('td')
            const actions = document.createElement('div')
            actions.className = 'action-icons'
            const removeButton = document.createElement('button')
            removeButton.type = 'button'
            removeButton.className = 'icon'
            removeButton.title = 'Eliminar'
            removeButton.setAttribute('aria-label', `Eliminar topping ${topping.nombre}`)
            removeButton.innerHTML = '<i class="bi bi-trash"></i>'
            removeButton.addEventListener('click', () => eliminarToppingAdmin(topping.id, topping.nombre))
            actions.append(removeButton)
            actionCell.append(actions)

            row.append(nameCell, priceCell, actionCell)
            toppingTableBody.append(row)
        })
    }
}

function datosProductos() {
    const datosPost = new FormData()
    datosPost.append('datosProductos', true)
    fetch('/tempus.focacceria/ajax/datos_productos.php', {
        method: "POST",
        body: datosPost
    })
    .then(response => response.json())
    .then(function (json) {
        let datos = '',datos2 = '',categoria = ''
        if (json.error != '') return alertify.error(json.error)
        renderizarOpcionesTopping(json.toppings)

        if (window.location.pathname.replace(/\/$/, '') === '/tempus.focacceria/productos') {
            json.resp.forEach(element => {
                const imagenProducto = element.imagen_ruta
                    ? `<img class="product-thumb is-clickable" src="/tempus.focacceria/${element.imagen_ruta}" alt="${element.nombre}" loading="lazy" />`
                    : '<span class="product-thumb no-image"></span>'
                    // 
                datos += `<tr data-product-id="${element.id}" data-category="${element.categoria_nombre || ''}" data-topping-limit="${Number(element.topping) || 0}">
                            <td><div class="product-cell">${imagenProducto}<div><strong>${element.nombre}</strong>
                            <small>${element.descripcion}</small></div></div></td>
                            <td>$${formatearPrecio(element.valor)}</td>
                            <td><div class="action-icons">
                            <i class="bi bi-pencil-square icon" title="Editar" onclick="editarProducto('${element.id}')"></i>
                            <i class="bi bi-trash icon" title="Eliminar" onclick="eliminarProducto('${element.id}')"></i></div></td>
                        </tr>`
            })
            json.categorias.forEach(element2 => {
                datos2 += `<tr>
                            <td><strong>${element2.nombre}</strong></td>
                            <td><div class="action-icons">
                            <i class="bi bi-trash icon" title="Eliminar" onclick="eliminarProducto('${element2.id}', true)"></i></div></td>
                        </tr>`
            })
            categoria += `<option value="" selected disabled>Seleccione una categoría</option><option value="0">Ninguno</option>`
            json.categorias.forEach(element3 => {
                categoria += `<option value="${element3.id}">${element3.nombre}</option>`
            })
            document.querySelector('#product-table-body').innerHTML = datos
            document.querySelector('#categoria-table-body').innerHTML = datos2
            document.querySelector('#categoria').innerHTML = categoria
            document.querySelector('#product-count').textContent = json.resp.length + ' productos'
            abrirModalProductoDesdeUrl()
        }else {
            renderizarProductosDesdeLista(json.resp, 1)
        }
    }).catch(error => {
        alertify.error('Ocurrio un error inesperado, vuelva a intentar por favor.')
        console.error('Error:', error);
    })
}

categoriaProducto = 0
function buscarProductos(categoria = '') {
    let nombre = ''
    if (categoria == '') {
        nombre = document.querySelector('#search').value
    }else {
        categoriaProducto = categoria
        document.querySelector('#search').value = ''
    }
    const datosPost = new FormData()
    datosPost.append('buscarProductos', true)
    datosPost.append('categoria', categoriaProducto)
    datosPost.append('nombre', nombre)
    fetch('/tempus.focacceria/ajax/datos_productos.php', {
        method: "POST",
        body: datosPost
    })
    .then(response => response.json())
    .then(function (json) {
        if (json.error != '') return alertify.error(json.error)
        renderizarProductosDesdeLista(json.resp, 1)
    }).catch(error => {
        alertify.error('Ocurrio un error inesperado, vuelva a intentar por favor.')
        console.error('Error:', error);
    })
}

function editarProducto(id = '') {
    document.querySelector('#nombre').value = ''
    document.querySelector('#descripcion').value = ''
    document.querySelector('#categoria').value = ''
    document.querySelector('#tag').value = ''
    document.querySelector('#precio').value = ''
    document.querySelector('#topping').value = '0'
    document.querySelector('#imagen').value = ''
    document.querySelector('#imagenes_cargadas').innerHTML = ''
    if (id == '') {
        document.querySelector('#title_ges').innerHTML = '<h2>Nuevo producto</h2>'  
        document.querySelector('#boton_carga_prod').textContent = 'Guardar producto'
        document.querySelector('#boton_carga_prod').setAttribute('onclick', `cargarProductos()`)
        return
    }
    const datosPost = new FormData()
    datosPost.append('editarProducto', true)
    datosPost.append('id', id)
    fetch('/tempus.focacceria/ajax/datos_productos.php', {
        method: "POST",
        body: datosPost
    })
    .then(response => response.json())
    .then(function (json) {
        let datos = '',imagenes = ''
        if (json.error != '') return alertify.error(json.error)
        document.querySelector('#title_ges').innerHTML = '<h2>Editar producto</h2><button class="icon" type="button" aria-label="Cerrar detalle del producto" onclick="editarProducto()">×</button>'
        document.querySelector('#boton_carga_prod').textContent = 'Editar producto'
        document.querySelector('#boton_carga_prod').setAttribute('onclick', `cargarProductos('${id}')`)
        json.resp.forEach(element => {
            document.querySelector('#nombre').value = element.nombre
            document.querySelector('#descripcion').value = element.descripcion
            document.querySelector('#categoria').value = element.categoria
            document.querySelector('#tag').value = element.tag
            document.querySelector('#precio').value = element.valor
            document.querySelector('#topping').value = element.topping || 0
        })
        json.imagenes.forEach(element => {
            imagenes += `<div class="loaded-image-item">
                                <img class="loaded-image-thumb" src="/tempus.focacceria/${element.imagen_ruta}" alt="${element.imagen_nombre}" loading="lazy" />
                                <span title="${element.imagen_nombre}">${element.imagen_nombre}</span>
                                <button class="loaded-image-remove" type="button" aria-label="Quitar ${element.imagen_nombre}" onclick="eliminarProducto(${element.id},'img',this)">×</button>
                            </div>`
        })
        document.querySelector('#imagenes_cargadas').innerHTML = imagenes
        document.querySelector('#nombre').focus()
    }).catch(error => {
        alertify.error('Ocurrio un error inesperado, vuelva a intentar por favor.')
        console.error('Error:', error);
    })
}

function cargarProductos(id = '') {
    const formulario = document.querySelector('#producto-form')
    const imagenInput = document.querySelector('#imagen')
    const nombre = document.querySelector('#nombre').value
    const descripcion = document.querySelector('#descripcion').value
    const categoria = document.querySelector('#categoria').value
    const tag = document.querySelector('#tag').value
    const precio = document.querySelector('#precio').value
    const topping = document.querySelector('#topping').value

    if (!formulario.checkValidity()) {
        formulario.reportValidity()
        return
    }

    const datosPost = new FormData()
    let titulo = id != '' ? 'Editar producto' : 'Nuevo producto',
    descripcionAlerta = id != '' ? '¿Seguro quiere editar este producto?' : '¿Seguro quiere cargar este producto?'
    if (id != '') {
        datosPost.append('editarProductos', true)
        datosPost.append('id', id)
    }else {
        datosPost.append('cargarProductos', true)
    }
    datosPost.append('nombre', nombre)
    datosPost.append('descripcion', descripcion)
    datosPost.append('categoria', categoria)
    datosPost.append('tag', tag)
    datosPost.append('precio', precio)
    datosPost.append('topping', topping)
    Array.from(imagenInput.files).forEach((imagen) => {
        datosPost.append('imagenes[]', imagen)
    })
    alertify.confirm(titulo, descripcionAlerta, function(){
        fetch('/tempus.focacceria/ajax/cargar_productos.php', {
            method: "POST",
            body: datosPost
        })
        .then(response => response.json())
        .then(function (json) {
            if (json.error != '') return alertify.error(json.error)
            editarProducto()
            datosProductos()
            return alertify.success(json.resp)
        }).catch(error => {
            alertify.error('Ocurrio un error inesperado, vuelva a intentar por favor.')
            console.error('Error:', error);
        })
    }, function(){ 
        alertify.error('Cancelado')
    })
}

function cargarCategoria() {
    const formulario = document.querySelector('#categoria-form')
    const nombre = document.querySelector('#nombre_categoria').value

    if (!formulario.checkValidity()) {
        formulario.reportValidity()
        return
    }
    const datosPost = new FormData()
    datosPost.append('cargarCategoria', true)
    datosPost.append('nombre', nombre)
    alertify.confirm('Nueva categoría', '\u00BFSeguro quiere cargar esta categoría?', function(){
        fetch('/tempus.focacceria/ajax/cargar_productos.php', {
            method: "POST",
            body: datosPost
        })
        .then(response => response.json())
        .then(function (json) {
            if (json.error != '') return alertify.error(json.error)
            document.querySelector('#nombre_categoria').value = ''
            datosProductos()
            return alertify.success(json.resp)
        }).catch(error => {
            alertify.error('Ocurrio un error inesperado, vuelva a intentar por favor.')
            console.error('Error:', error);
        })
    }, function(){ 
        alertify.error('Cancelado')
    })
}

function cargarTopping() {
    const form = document.querySelector('#topping-form')
    if (!form.checkValidity()) {
        form.reportValidity()
        return
    }

    const datosPost = new FormData()
    datosPost.append('cargarTopping', true)
    datosPost.append('nombre', document.querySelector('#nombre_topping').value.trim())
    datosPost.append('precio', document.querySelector('#precio_topping').value)

    alertify.confirm('Nuevo topping', '¿Seguro querés cargar este topping?', function () {
        fetch('/tempus.focacceria/ajax/cargar_productos.php', { method: 'POST', body: datosPost })
            .then(response => response.json())
            .then((json) => {
                if (json.error) return alertify.error(json.error)
                form.reset()
                datosProductos()
                alertify.success(json.resp)
            })
            .catch((error) => {
                alertify.error('No se pudo cargar el topping')
                console.error('Error:', error)
            })
    }, function () {
        alertify.error('Cancelado')
    })
}

function eliminarToppingAdmin(id, nombre) {
    const datosPost = new FormData()
    datosPost.append('eliminarTopping', true)
    datosPost.append('id', id)

    alertify.confirm('Eliminar topping', `¿Seguro querés eliminar ${nombre}?`, function () {
        fetch('/tempus.focacceria/ajax/eliminar_producto.php', { method: 'POST', body: datosPost })
            .then(response => response.json())
            .then((json) => {
                if (json.error) return alertify.error(json.error)
                datosProductos()
                alertify.success(json.resp)
            })
            .catch((error) => {
                alertify.error('No se pudo eliminar el topping')
                console.error('Error:', error)
            })
    }, function () {
        alertify.error('Cancelado')
    })
}

function eliminarProducto(id, categoria = false, element = false) {
    const datosPost = new FormData()
    if (categoria == 'img') {
        datosPost.append('eliminarImagen', true)
    }else if (categoria) {
        datosPost.append('eliminarCategoria', true)
    }else {
        datosPost.append('eliminarProducto', true)
    }
    datosPost.append('id', id)
    let mensaje = categoria ? '¿Seguro quiere eliminar esta categoría?' : '¿Seguro quiere eliminar este producto?',
    titulo = categoria ? 'Eliminar categoría' : 'Eliminar producto'
    mensaje = categoria == 'img' ? '¿Seguro quiere eliminar esta imagen?' : mensaje
    titulo = categoria == 'img' ? 'Eliminar imagen' : titulo
    alertify.confirm(titulo, mensaje, function(){
        fetch('/tempus.focacceria/ajax/eliminar_producto.php', {
            method: "POST",
            body: datosPost
        })
        .then(response => response.json())
        .then(function (json) {
            if (json.error != '') return alertify.error(json.error)
            if (element) element.closest('.loaded-image-item').remove()
            datosProductos()
            return alertify.success(json.resp)
        }).catch(error => {
            alertify.error('Ocurrio un error inesperado, vuelva a intentar por favor.')
            console.error('Error:', error);
        })
    }, function(){ 
        alertify.error('Cancelado')
    })
}

function cargarCarrito(id, toppingSelection = []) {
    const datosPost = new FormData()
    datosPost.append('cargarCarrito', true)
    datosPost.append('id', id)
    const toppings = toppingSelection.filter(topping => topping?.id && topping.cantidad > 0)
    const cartKey = `${String(id)}|${toppings.map(topping => `${topping.id}:${topping.cantidad}`).join(',')}`

    fetch('/tempus.focacceria/ajax/cargar_carrito.php', {
        method: "POST",
        body: datosPost
    })
    .then(response => response.json())
    .then(function (json) {
        if (json.error != '') return alertify.error(json.error)
        json.resp.forEach((element) => {
            const item = carrito.get(cartKey)
            if (item) {
                item.cantidad += 1
                return
            }

            const precioBase = Number(element.valor) || 0
            const precioToppings = toppings.reduce((total, topping) => total + topping.precio * topping.cantidad, 0)
            carrito.set(cartKey, {
                ...element,
                toppings,
                precioBase,
                precio: precioBase + precioToppings,
                cantidad: 1
            })
        })
        renderizarCarrito()
        // alertify.success('Producto agregado al carrito')
    }).catch(error => {
        alertify.error('Ocurrio un error inesperado, vuelva a intentar por favor.')
        console.error('Error:', error);
    })
}

function compartirProducto(id, nombre, precio) {
    if (!id) return

    const urlProducto = new URL(window.location.href)
    urlProducto.searchParams.delete('carrito')
    urlProducto.searchParams.delete('toppings')
    urlProducto.searchParams.delete('fechaPedido')
    urlProducto.searchParams.delete('extrasPedido')
    urlProducto.searchParams.delete('id')
    urlProducto.searchParams.set('id', String(id))
    const enlace = urlProducto.toString()
    const datos = {
        title: nombre,
        text: `Mirá este producto: ${nombre} - ${precio}`,
        url: enlace
    }

    if (navigator.share) {
        navigator.share(datos).catch(() => {})
        return
    }

    if (!navigator.clipboard) {
        alertify.error(`Compartí este enlace: ${enlace}`)
        return
    }

    navigator.clipboard.writeText(enlace)
        .then(() => alertify.success('Enlace del producto copiado'))
        .catch(() => alertify.error(`Compartí este enlace: ${enlace}`))
}

function abrirModalProductoDesdeUrl() {
    const id = new URLSearchParams(window.location.search).get('id')
    if (id && window.abrirModalProductoPorId) window.abrirModalProductoPorId(id)
}


function initializeToppingPreview() {
    const modal = document.querySelector('#product-modal')
    const totalElement = modal?.querySelector('#topping-extra-total')
    const limitNote = modal?.querySelector('#topping-limit-note')
    if (!modal || !totalElement) return

    const getToppingItems = () => Array.from(modal.querySelectorAll('[data-topping-item]'))

    function updateToppingTotal() {
        const toppingItems = getToppingItems()
        const selectedCount = toppingItems.reduce((sum, item) => {
            return sum + (Number(item.querySelector('[data-topping-count]').textContent) || 0)
        }, 0)
        const toppingLimit = Number(modal.dataset.toppingLimit) || 0
        const total = toppingItems.reduce((sum, item) => {
            const quantity = Number(item.querySelector('[data-topping-count]').textContent) || 0
            return sum + quantity * Number(item.dataset.toppingPrice)
        }, 0)
        totalElement.textContent = `$${total.toLocaleString('es-AR')}`
        if (limitNote && toppingLimit) limitNote.textContent = `${selectedCount}/${toppingLimit}`
        toppingItems.forEach((item) => {
            const quantity = Number(item.querySelector('[data-topping-count]').textContent) || 0
            item.querySelector('[data-topping-step="add"]').disabled = selectedCount >= toppingLimit
            item.querySelector('[data-topping-step="remove"]').disabled = quantity === 0
        })
    }

    function resetToppings() {
        getToppingItems().forEach((item) => {
            item.querySelector('[data-topping-count]').textContent = '0'
            item.querySelector('[data-topping-step="remove"]').disabled = true
        })
        updateToppingTotal()
    }

    modal.addEventListener('click', (event) => {
        const button = event.target.closest('[data-topping-step]')
        if (!button) return

        const item = button.closest('[data-topping-item]')
        const count = item.querySelector('[data-topping-count]')
        const toppingItems = getToppingItems()
        const selectedCount = toppingItems.reduce((sum, toppingItem) => {
            return sum + (Number(toppingItem.querySelector('[data-topping-count]').textContent) || 0)
        }, 0)
        const toppingLimit = Number(modal.dataset.toppingLimit) || 0
        if (button.dataset.toppingStep === 'add' && selectedCount >= toppingLimit) return
        const nextCount = Math.max(0, Number(count.textContent) + (button.dataset.toppingStep === 'add' ? 1 : -1))
        count.textContent = String(nextCount)
        item.querySelector('[data-topping-step="remove"]').disabled = nextCount === 0
        updateToppingTotal()
    })

    let wasVisible = modal.classList.contains('is-visible')
    new MutationObserver(() => {
        const isVisible = modal.classList.contains('is-visible')
        if (isVisible && !wasVisible) resetToppings()
        wasVisible = isVisible
    }).observe(modal, { attributes: true, attributeFilter: ['class'] })
}
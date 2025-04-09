document.addEventListener('DOMContentLoaded', () => {
    const ordersContainer = document.getElementById('ordersContainer');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const errorMessage = document.getElementById('errorMessage');

    // Modal elements
    const createOrderModal = document.getElementById('createOrderModal');
    const pauseReasonModal = document.getElementById('pauseReasonModal');
    const openCreateModalBtn = document.getElementById('openCreateModal');
    const closeModalBtns = document.querySelectorAll('.close-modal');
    const createOrderForm = document.getElementById('createOrderForm');
    const pauseReasonForm = document.getElementById('pauseReasonForm');

    // Current order ID for pause/resume/start/finish actions
    let currentOrderId = null;

    // Modal control functions
    function openModal(modal) {
        modal.style.display = 'block';
    }

    function closeModal(modal) {
        modal.style.display = 'none';
    }

    // Open create order modal
    openCreateModalBtn.addEventListener('click', () => {
        openModal(createOrderModal);
    });

    // Close modal event listeners
    closeModalBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const modal = btn.closest('.modal');
            closeModal(modal);
        });
    });

    // Close modal if clicked outside
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            closeModal(e.target);
        }
    });

    // Handle create order form submission
    createOrderForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const orderCode = document.getElementById('orderCode').value;
        const articleCode = document.getElementById('articleCode').value;
        
        // Add default prefixes if not present
        const formattedOrderCode = orderCode.startsWith('MFG-') ? orderCode : `MFG-${orderCode}`;
        const formattedArticleCode = articleCode.startsWith('ART-') ? articleCode : `ART-${articleCode}`;
        
        const formData = {
            order_code: formattedOrderCode,
            article_code: formattedArticleCode,
            description: document.getElementById('description').value,
            quantity: parseInt(document.getElementById('quantity').value),
            target_production_rate: parseInt(document.getElementById('targetProductionRate').value)
        };

        try {
            const response = await fetch('http://192.168.11.25:3000/api/manufacturing/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                closeModal(document.getElementById('createOrderModal'));
                fetchManufacturingOrders();
                document.getElementById('createOrderForm').reset();
                alert('Orden creada exitosamente');
            } else {
                const errorData = await response.text();
                console.error('Create Order Error:', errorData);
                alert(`Error: ${errorData}`);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error de conexión al crear la orden');
        }
    });

    // Handle pause reason form submission
    pauseReasonForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (!currentOrderId) {
            alert('Error: No se ha seleccionado una orden');
            return;
        }

        // Prepare pause data
        const formData = {
            pause_reason_id: document.getElementById('pauseReasonSelect').value,
            comments: document.getElementById('pauseComments').value
        };

        try {
            // Send POST request to pause order
            const response = await fetch(`http://192.168.11.25:3000/api/manufacturing/${currentOrderId}/pause`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            // Handle response
            if (response.ok) {
                // Close modal
                closeModal(pauseReasonModal);
                
                // Refresh orders list
                fetchManufacturingOrders();
                
                // Reset form
                pauseReasonForm.reset();
                
                // Show success message
                alert('Orden pausada exitosamente');
            } else {
                const errorData = await response.text();
                console.error('Pause Order Error:', {
                    status: response.status,
                    statusText: response.statusText,
                    errorBody: errorData
                });
                alert(`Error: ${errorData || 'No se pudo pausar la orden'}`);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error de conexión al pausar la orden');
        }
    });

    // Función para cargar órdenes de fabricación en el selector
    async function populateManufacturingOrdersSelect() {
        const select = document.getElementById('associatedManufacturingOrder');
        
        try {
            const response = await fetch('http://192.168.11.25:3000/api/manufacturing/');
            
            if (!response.ok) {
                throw new Error('No se pudieron cargar las órdenes de fabricación');
            }

            const data = await response.json();
            const orders = data.orders || [];

            // Limpiar opciones existentes
            select.innerHTML = '<option value="">Seleccionar Orden de Fabricación</option>';

            // Añadir opciones de órdenes de fabricación
            orders.forEach(order => {
                const option = document.createElement('option');
                option.value = order.order_id;
                option.textContent = `${order.order_code} - ${order.description}`;
                select.appendChild(option);
            });
        } catch (error) {
            console.error('Error al cargar órdenes de fabricación:', error);
        }
    }

    // Función para cargar órdenes de limpieza
    async function fetchCleaningOrders() {
        const cleaningOrdersContainer = document.getElementById('cleaningOrdersContainer');
        
        try {
            const response = await fetch('http://192.168.11.25:3000/api/cleaning/');
            
            if (!response.ok) {
                throw new Error('No se pudieron cargar las órdenes de limpieza');
            }

            const data = await response.json();
            const orders = data.orders || [];

            // Limpiar contenedor
            cleaningOrdersContainer.innerHTML = '';

            if (orders.length === 0) {
                cleaningOrdersContainer.innerHTML = `
                    <div class="cleaning-order-item" style="text-align: center; color: #7f8c8d;">
                        No hay órdenes de limpieza
                    </div>
                `;
                return;
            }

            // Poblar órdenes de limpieza
            orders.forEach(order => {
                const orderElement = document.createElement('div');
                orderElement.classList.add('cleaning-order-item');
                
                // Determinar botones de acción según el estado
                let actionButtons = '';
                switch(order.status.toUpperCase()) {
                    case 'CREATED':
                        actionButtons = `
                            <div class="order-actions">
                                <a href="#" class="btn btn-start btn-cleaning-start" data-order-id="${order.order_id}">Iniciar</a>
                            </div>
                        `;
                        break;
                    case 'STARTED':
                        actionButtons = `
                            <div class="order-actions">
                                <a href="#" class="btn btn-finish btn-cleaning-finish" data-order-id="${order.order_id}">Finalizar</a>
                            </div>
                        `;
                        break;
                    case 'FINISHED':
                        actionButtons = '';
                        break;
                }
                
                orderElement.innerHTML = `
                    <div class="order-info">
                        <span class="order-code">${order.order_code}</span>
                        <span class="order-status status-${order.status.toLowerCase()}">${order.status}</span>
                    </div>
                    <div class="order-details">
                        <div><strong>Tipo:</strong> ${order.cleaning_type}</div>
                        <div><strong>Área:</strong> ${order.area_name}</div>
                    </div>
                    ${actionButtons}
                `;

                cleaningOrdersContainer.appendChild(orderElement);
            });

        } catch (error) {
            console.error('Error al cargar órdenes de limpieza:', error);
            cleaningOrdersContainer.innerHTML = `
                <div class="cleaning-order-item" style="text-align: center; color: #e74c3c;">
                    Error al cargar las órdenes de limpieza
                </div>
            `;
        }
    }

    // Evento para abrir modal de limpieza
    document.getElementById('openCleaningModal').addEventListener('click', () => {
        openModal(document.getElementById('createCleaningModal'));
    });

    // Manejar creación de orden de limpieza
    document.getElementById('createCleaningForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = {
            order_code: document.getElementById('cleaningOrderCode').value,
            cleaning_type: 'STANDARD',
            area_id: 'AREA-001',
            area_name: 'AREA-001',
            description: document.getElementById('cleaningDescription').value,
            estimated_duration_minutes: document.getElementById('estimatedDuration').value || null
        };

        try {
            const response = await fetch('http://192.168.11.25:3000/api/cleaning/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                closeModal(document.getElementById('createCleaningModal'));
                await fetchCleaningOrders();
                document.getElementById('createCleaningForm').reset();
                alert('Orden de limpieza creada exitosamente');
            } else {
                const errorData = await response.text();
                console.error('Create Cleaning Order Error:', errorData);
                alert(`Error: ${errorData}`);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error de conexión al crear la orden de limpieza');
        }
    });

    // Eventos para iniciar y finalizar órdenes de limpieza
    document.getElementById('cleaningOrdersContainer').addEventListener('click', async (e) => {
        e.preventDefault();
        
        if (!e.target.dataset.orderId) return;
        
        const orderId = e.target.dataset.orderId;
        const action = e.target.classList.contains('btn-cleaning-start') ? 'start' : 
                      e.target.classList.contains('btn-cleaning-finish') ? 'finish' : null;

        if (!action) return;

        try {
            const response = await fetch(`http://192.168.11.25:3000/api/cleaning/${orderId}/${action}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (response.ok) {
                await fetchCleaningOrders();
                alert(`Orden de limpieza ${action === 'start' ? 'iniciada' : 'finalizada'} exitosamente`);
            } else {
                const errorData = await response.text();
                console.error(`${action === 'start' ? 'Start' : 'Finish'} Cleaning Order Error:`, errorData);
                alert(`Error al ${action === 'start' ? 'iniciar' : 'finalizar'}: ${errorData}`);
            }
        } catch (error) {
            console.error('Error:', error);
            alert(`Error de conexión al ${action === 'start' ? 'iniciar' : 'finalizar'} la orden de limpieza`);
        }
    });

    // Cargar órdenes de limpieza al iniciar
    fetchCleaningOrders();

    // Function to fetch and display orders
    async function fetchManufacturingOrders() {
        // Show loading indicator
        loadingIndicator.style.display = 'block';
        errorMessage.style.display = 'none';

        try {
            const response = await fetch('http://192.168.11.25:3000/api/manufacturing/');
            
            if (!response.ok) {
                throw new Error('No se pudieron cargar las órdenes');
            }

            const data = await response.json();

            // Clear previous orders
            ordersContainer.innerHTML = '';

            // Check if orders array exists
            const orders = data.orders || [];

            // Check if orders array is empty
            if (orders.length === 0) {
                ordersContainer.innerHTML = `
                    <div class="order-row" style="text-align: center; color: #7f8c8d;">
                        No hay órdenes de fabricación
                    </div>
                `;
                return;
            }

            // Populate orders
            orders.forEach(order => {
                const orderElement = document.createElement('div');
                orderElement.classList.add('order-row');
                
                // Normalize status to uppercase for easier comparison
                const status = (order.status || '').toUpperCase();
                
                // Determine action buttons based on order status
                let actionButtons = '';
                switch(status) {
                    case 'CREATED':
                        actionButtons = `
                            <a href="#" class="btn btn-start" data-order-id="${order.order_id}">Iniciar</a>
                            <a href="#" class="btn btn-edit" data-order-id="${order.order_id}">Editar</a>
                        `;
                        break;
                    case 'STARTED':
                    case 'RESUMED':
                        actionButtons = `
                            <a href="#" class="btn btn-pause" data-order-id="${order.order_id}">Pausar</a>
                            <a href="#" class="btn btn-finish" data-order-id="${order.order_id}">Finalizar</a>
                        `;
                        break;
                    case 'PAUSED':
                        actionButtons = `
                            <a href="#" class="btn btn-resume" data-order-id="${order.order_id}">Reanudar</a>
                        `;
                        break;
                    case 'FINISHED':
                        actionButtons = 'Completada';
                        break;
                    default:
                        actionButtons = `
                            <a href="#" class="btn btn-start" data-order-id="${order.order_id}">Iniciar</a>
                            <a href="#" class="btn btn-edit" data-order-id="${order.order_id}">Editar</a>
                        `;
                        console.warn(`Unhandled status: ${order.status}`);
                }
                
                orderElement.innerHTML = `
                    <div>${order.order_code || 'N/A'}</div>
                    <div>${order.article_code || 'N/A'}</div>
                    <div>${order.description || 'Sin descripción'}</div>
                    <div>${order.quantity || 0}</div>
                    <div>${order.target_production_rate || 0}</div>
                    <div>${status}</div>
                    <div class="action-buttons">
                        ${actionButtons}
                    </div>
                `;

                ordersContainer.appendChild(orderElement);
            });

            // Hide loading indicator
            loadingIndicator.style.display = 'none';

        } catch (error) {
            // Handle errors
            console.error('Error:', error);
            errorMessage.textContent = error.message;
            errorMessage.style.display = 'block';
            loadingIndicator.style.display = 'none';
        }
    }

    // Fetch orders on page load
    fetchManufacturingOrders();

    // Event delegation for order actions
    ordersContainer.addEventListener('click', async (e) => {
        e.preventDefault();
        const orderId = e.target.dataset.orderId;

        // Start order
        if (e.target.classList.contains('btn-start')) {
            try {
                const response = await fetch(`http://192.168.11.25:3000/api/manufacturing/${orderId}/start`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    }
                });

                if (response.ok) {
                    fetchManufacturingOrders();
                    alert('Orden iniciada exitosamente');
                } else {
                    // Log more detailed error information
                    const errorData = await response.text();
                    console.error('Start Order Error:', {
                        status: response.status,
                        statusText: response.statusText,
                        errorBody: errorData
                    });
                    alert(`Error al iniciar: ${errorData || 'No se pudo iniciar la orden'}`);
                }
            } catch (error) {
                console.error('Error:', error);
                alert('Error de conexión al iniciar la orden');
            }
        }

        // Pause order
        if (e.target.classList.contains('btn-pause')) {
            currentOrderId = orderId;
            openModal(pauseReasonModal);
        }

        // Resume order
        if (e.target.classList.contains('btn-resume')) {
            try {
                const response = await fetch(`http://192.168.11.25:3000/api/manufacturing/${orderId}/resume`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    }
                });

                if (response.ok) {
                    fetchManufacturingOrders();
                    alert('Orden reanudada exitosamente');
                } else {
                    const errorData = await response.text();
                    console.error('Resume Order Error:', {
                        status: response.status,
                        statusText: response.statusText,
                        errorBody: errorData
                    });
                    alert(`Error al reanudar: ${errorData || 'No se pudo reanudar la orden'}`);
                }
            } catch (error) {
                console.error('Error:', error);
                alert('Error de conexión al reanudar la orden');
            }
        }

        // Finish order
        if (e.target.classList.contains('btn-finish')) {
            try {
                const response = await fetch(`http://192.168.11.25:3000/api/manufacturing/${orderId}/finish`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    }
                });

                if (response.ok) {
                    fetchManufacturingOrders();
                    alert('Orden finalizada exitosamente');
                } else {
                    const errorData = await response.text();
                    console.error('Finish Order Error:', {
                        status: response.status,
                        statusText: response.statusText,
                        errorBody: errorData
                    });
                    alert(`Error al finalizar: ${errorData || 'No se pudo finalizar la orden'}`);
                }
            } catch (error) {
                console.error('Error:', error);
                alert('Error de conexión al finalizar la orden');
            }
        }

        // Edit order
        if (e.target.classList.contains('btn-edit')) {
            alert(`Editar orden ${orderId} - Funcionalidad no implementada`);
        }
    });

    // Función para buscar órdenes
    async function searchOrders(searchTerm) {
        try {
            const response = await fetch('http://192.168.11.25:4000/api/search', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ term: searchTerm })
            });

            if (!response.ok) {
                throw new Error('Error en la búsqueda');
            }

            return await response.json();
        } catch (error) {
            console.error('Error al buscar órdenes:', error);
            return [];
        }
    }

    // Función para mostrar resultados de búsqueda
    function displaySearchResults(results) {
        const searchResults = document.getElementById('searchResults');
        searchResults.innerHTML = '';

        if (results.length === 0) {
            searchResults.style.display = 'none';
            return;
        }

        const ul = document.createElement('ul');
        results.forEach(result => {
            const li = document.createElement('li');
            li.textContent = `${result.label} - ${result.description}`;
            li.addEventListener('click', () => {
                // Rellenar el formulario con los datos de la orden seleccionada
                document.getElementById('orderCode').value = result.label;
                document.getElementById('articleCode').value = result.codArticle;
                document.getElementById('description').value = result.description;
                document.getElementById('quantity').value = result.quantity;
                // Ocultar resultados
                searchResults.style.display = 'none';
            });
            ul.appendChild(li);
        });

        searchResults.appendChild(ul);
        searchResults.style.display = 'block';
    }

    // Event listener para el campo de búsqueda
    document.getElementById('searchOrder').addEventListener('input', async (e) => {
        const searchTerm = e.target.value;
        if (searchTerm.length < 2) {
            document.getElementById('searchResults').style.display = 'none';
            return;
        }

        const results = await searchOrders(searchTerm);
        displaySearchResults(results);
    });

    // Cerrar resultados al hacer clic fuera
    document.addEventListener('click', (e) => {
        const searchResults = document.getElementById('searchResults');
        const searchInput = document.getElementById('searchOrder');
        
        if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
            searchResults.style.display = 'none';
        }
    });
});
document.addEventListener('DOMContentLoaded', () => {
    const ordersContainer = document.getElementById('ordersContainer');
    const cleaningOrdersContainer = document.getElementById('cleaningOrdersContainer');
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

    // Pagination elements
    const manufacturingPageSize = document.getElementById('manufacturingPageSize');
    const prevManufacturingPage = document.getElementById('prevManufacturingPage');
    const nextManufacturingPage = document.getElementById('nextManufacturingPage');
    const manufacturingPageInfo = document.getElementById('manufacturingPageInfo');

    const cleaningPageSize = document.getElementById('cleaningPageSize');
    const prevCleaningPage = document.getElementById('prevCleaningPage');
    const nextCleaningPage = document.getElementById('nextCleaningPage');
    const cleaningPageInfo = document.getElementById('cleaningPageInfo');

    // Pagination state
    let manufacturingState = {
        currentPage: 1,
        pageSize: 10,
        totalItems: 0
    };

    let cleaningState = {
        currentPage: 1,
        pageSize: 10,
        totalItems: 0
    };

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
        loadingIndicator.style.display = 'block';
        errorMessage.style.display = 'none';

        try {
            const response = await fetch(`http://192.168.11.25:3000/api/cleaning/?page=${cleaningState.currentPage}&pageSize=${cleaningState.pageSize}`);
            const data = await response.json();

            cleaningState.totalItems = data.total || 0;
            updatePaginationControls(cleaningState, prevCleaningPage, nextCleaningPage, cleaningPageInfo);

            cleaningOrdersContainer.innerHTML = '';
            data.orders.forEach(order => {
                const orderElement = createCleaningOrderElement(order);
                cleaningOrdersContainer.appendChild(orderElement);
            });
        } catch (error) {
            console.error('Error:', error);
            errorMessage.textContent = 'Error al cargar las órdenes de limpieza';
            errorMessage.style.display = 'block';
        } finally {
            loadingIndicator.style.display = 'none';
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
        loadingIndicator.style.display = 'block';
        errorMessage.style.display = 'none';

        try {
            const response = await fetch(`http://192.168.11.25:3000/api/manufacturing/?page=${manufacturingState.currentPage}&pageSize=${manufacturingState.pageSize}`);
            const data = await response.json();

            manufacturingState.totalItems = data.total || 0;
            updatePaginationControls(manufacturingState, prevManufacturingPage, nextManufacturingPage, manufacturingPageInfo);

            ordersContainer.innerHTML = '';
            data.orders.forEach(order => {
                const orderElement = createManufacturingOrderElement(order);
                ordersContainer.appendChild(orderElement);
            });
        } catch (error) {
            console.error('Error:', error);
            errorMessage.textContent = 'Error al cargar las órdenes de fabricación';
            errorMessage.style.display = 'block';
        } finally {
            loadingIndicator.style.display = 'none';
        }
    }

    // Fetch orders on page load
    fetchManufacturingOrders();

    // Event delegation for order actions
    ordersContainer.addEventListener('click', handleOrderAction);
    cleaningOrdersContainer.addEventListener('click', handleOrderAction);

    async function handleOrderAction(e) {
        e.preventDefault();
        const orderId = e.target.dataset.orderId;
        if (!orderId) return;

        const action = e.target.classList.contains('btn-start') ? 'start' :
                      e.target.classList.contains('btn-pause') ? 'pause' :
                      e.target.classList.contains('btn-resume') ? 'resume' :
                      e.target.classList.contains('btn-finish') ? 'finish' : null;

        if (!action) return;

        try {
            const response = await fetch(`http://192.168.11.25:3000/api/${e.target.closest('#ordersContainer') ? 'manufacturing' : 'cleaning'}/${orderId}/${action}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (response.ok) {
                if (e.target.closest('#ordersContainer')) {
                    fetchManufacturingOrders();
                } else {
                    fetchCleaningOrders();
                }
                alert(`Orden ${action === 'start' ? 'iniciada' : action === 'pause' ? 'pausada' : action === 'resume' ? 'reanudada' : 'finalizada'} exitosamente`);
            } else {
                const errorData = await response.text();
                alert(`Error: ${errorData}`);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error de conexión');
        }
    }

    // Función para crear elementos de orden de fabricación
    function createManufacturingOrderElement(order) {
        const orderElement = document.createElement('div');
        orderElement.classList.add('order-row');
        
        const status = (order.status || '').toUpperCase();
        let actionButtons = '';
        
        switch(status) {
            case 'CREATED':
                actionButtons = `
                    <a href="#" class="btn btn-start" data-order-id="${order.order_id}">Iniciar</a>
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
        }
        
        orderElement.innerHTML = `
            <div>${order.order_code || 'N/A'}</div>
            <div>${order.article_code || 'N/A'}</div>
            <div>${order.description || 'Sin descripción'}</div>
            <div>${order.quantity || 0}</div>
            <div>${order.target_production_rate || 0}</div>
            <div>${status}</div>
            <div class="action-buttons">${actionButtons}</div>
        `;

        return orderElement;
    }

    // Función para crear elementos de orden de limpieza
    function createCleaningOrderElement(order) {
        const orderElement = document.createElement('div');
        orderElement.classList.add('order-row');
        
        const status = (order.status || '').toUpperCase();
        let actionButtons = '';
        
        switch(status) {
            case 'CREATED':
                actionButtons = `
                    <a href="#" class="btn btn-start" data-order-id="${order.order_id}">Iniciar</a>
                `;
                break;
            case 'STARTED':
                actionButtons = `
                    <a href="#" class="btn btn-finish" data-order-id="${order.order_id}">Finalizar</a>
                `;
                break;
            case 'FINISHED':
                actionButtons = 'Completada';
                break;
        }
        
        orderElement.innerHTML = `
            <div>${order.order_code || 'N/A'}</div>
            <div>${order.area_name || 'N/A'}</div>
            <div>${order.description || 'Sin descripción'}</div>
            <div>${status}</div>
            <div class="action-buttons">${actionButtons}</div>
        `;

        return orderElement;
    }

    // Funciones de paginación
    function updatePaginationControls(state, prevBtn, nextBtn, pageInfo) {
        prevBtn.disabled = state.currentPage === 1;
        nextBtn.disabled = state.currentPage * state.pageSize >= state.totalItems;
        pageInfo.textContent = `Página ${state.currentPage}`;
    }

    // Event listeners para paginación de fabricación
    manufacturingPageSize.addEventListener('change', (e) => {
        manufacturingState.pageSize = parseInt(e.target.value);
        manufacturingState.currentPage = 1;
        fetchManufacturingOrders();
    });

    prevManufacturingPage.addEventListener('click', () => {
        if (manufacturingState.currentPage > 1) {
            manufacturingState.currentPage--;
            fetchManufacturingOrders();
        }
    });

    nextManufacturingPage.addEventListener('click', () => {
        if (manufacturingState.currentPage * manufacturingState.pageSize < manufacturingState.totalItems) {
            manufacturingState.currentPage++;
            fetchManufacturingOrders();
        }
    });

    // Event listeners para paginación de limpieza
    cleaningPageSize.addEventListener('change', (e) => {
        cleaningState.pageSize = parseInt(e.target.value);
        cleaningState.currentPage = 1;
        fetchCleaningOrders();
    });

    prevCleaningPage.addEventListener('click', () => {
        if (cleaningState.currentPage > 1) {
            cleaningState.currentPage--;
            fetchCleaningOrders();
        }
    });

    nextCleaningPage.addEventListener('click', () => {
        if (cleaningState.currentPage * cleaningState.pageSize < cleaningState.totalItems) {
            cleaningState.currentPage++;
            fetchCleaningOrders();
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
document.addEventListener('DOMContentLoaded', function() {
    console.log('Admin page loaded');
    checkAdminAccess();
    setupOrderFilters();
    setupExportOrders();
});

function checkAdminAccess() {
    const isLoggedIn = sessionStorage.getItem('loggedIn') === 'true';
    const accountType = sessionStorage.getItem('accountType');
    const adminContent = document.getElementById('admin-content');
    const accessDeniedMessage = document.getElementById('access-denied-message');

    if (isLoggedIn && accountType === 'admin') {
        console.log('Admin access granted.');
        if (adminContent) adminContent.style.display = 'block';
        if (accessDeniedMessage) accessDeniedMessage.style.display = 'none';
        loadCustomerOrders();
    } else {
        console.log('Admin access denied. Redirecting or showing message.');
        if (adminContent) adminContent.style.display = 'none';
        if (accessDeniedMessage) accessDeniedMessage.style.display = 'block';
    }
}

let allOrders = [];
let currentFilterStatus = 'all';

function loadCustomerOrders() {
    const ordersList = document.getElementById('orders-list');
    if (!ordersList) return;

    try {
        allOrders = JSON.parse(localStorage.getItem('orders')) || [];
        console.log('Loaded orders:', allOrders);
        if (!Array.isArray(allOrders)) {
            console.warn('orders in localStorage is not an array, resetting to empty array');
            allOrders = [];
        }
        displayOrders();
    } catch (error) {
        console.error('Error loading orders from localStorage:', error);
        ordersList.innerHTML = '<p>Error loading orders.</p>';
    }
}

function displayOrders() {
    const ordersList = document.getElementById('orders-list');
    if (!ordersList) return;

    ordersList.innerHTML = ''; // Clear previous orders

    const filteredOrders = allOrders.filter(order => {
        return currentFilterStatus === 'all' || order.status === currentFilterStatus;
    });

    if (filteredOrders.length === 0) {
        ordersList.innerHTML = '<p>No orders found with the current filter.</p>';
        return;
    }

    // Sort by date (newest first) using safe parsing
    filteredOrders.sort((a, b) => {
        const dateA = a && a.date ? new Date(a.date).getTime() : 0;
        const dateB = b && b.date ? new Date(b.date).getTime() : 0;
        return dateB - dateA;
    }); // Newest first

    filteredOrders.forEach(order => {
        try {
            const orderCard = document.createElement('div');
            orderCard.classList.add('order-card');

            const orderDate = order && order.date ? new Date(order.date).toLocaleString() : 'Unknown';
            const orderId = order && (order.orderId || order.id) ? (order.orderId || order.id) : 'N/A';
            const customerName = order && order.name ? order.name : 'Unknown';
            const customerEmail = order && order.email ? order.email : '—';
            const status = order && order.status ? String(order.status) : 'unknown';
            const total = Number(order && order.total ? order.total : 0);
            const cartItems = Array.isArray(order && order.cart ? order.cart : []) ? order.cart : (order && order.items ? order.items : []);

            // Build items HTML safely
            const itemsHtml = (cartItems || []).map(item => {
                const name = item && item.name ? item.name : 'Item';
                const qty = Number(item && item.quantity ? item.quantity : 0);
                const price = Number(item && item.price ? item.price : 0);
                return `
                    <div class="order-item">
                        <span class="order-item-name">${name}</span>
                        <span class="order-item-details">${qty} x $${price.toFixed(2)}</span>
                    </div>
                `;
            }).join('');

            orderCard.innerHTML = `
                <h3>Order ID: ${orderId}</h3>
                <p><strong>Customer:</strong> ${customerName} (${customerEmail})</p>
                <p><strong>Date:</strong> ${orderDate}</p>
                <p><strong>Status:</strong> <span class="order-status-${status}">${status.toUpperCase()}</span></p>
                <p><strong>Total:</strong> $${total.toFixed(2)}</p>
                <div class="order-items">
                    <h4>Items:</h4>
                    ${itemsHtml}
                </div>
                <p class="order-total"><strong>Order Total:</strong> $${total.toFixed(2)}</p>
            `;
            ordersList.appendChild(orderCard);
        } catch (err) {
            console.error('Error rendering order, skipping this order:', err, order);
        }
    });
}

function setupOrderFilters() {
    const filterSelect = document.getElementById('order-status-filter');
    if (filterSelect) {
        filterSelect.addEventListener('change', function() {
            currentFilterStatus = this.value;
            displayOrders();
        });
    }
}

function setupExportOrders() {
    const exportBtn = document.getElementById('export-orders-btn');
    if (exportBtn) {
        exportBtn.addEventListener('click', function() {
            exportOrdersToCSV();
        });
    }
}

function exportOrdersToCSV() {
    if (allOrders.length === 0) {
        alert('No orders to export.');
        return;
    }

    let csvContent = "data:text/csv;charset=utf-8,";
    
    // Headers
    const headers = ["OrderID", "CustomerName", "CustomerEmail", "OrderDate", "Status", "Total", "Items"];
    csvContent += headers.join(',') + "\n";

    // Data rows
    allOrders.forEach(order => {
        try {
            const itemsArr = Array.isArray(order && order.cart ? order.cart : []) ? order.cart : (order && order.items ? order.items : []);
            const items = (itemsArr || []).map(item => {
                const name = item && item.name ? item.name : 'Item';
                const qty = Number(item && item.quantity ? item.quantity : 0);
                return `${name} (x${qty})`;
            }).join('; ');

            const total = Number(order && order.total ? order.total : 0);
            const row = [
                order && (order.orderId || order.id) ? (order.orderId || order.id) : '',
                order && order.name ? order.name : '',
                order && order.email ? order.email : '',
                order && order.date ? new Date(order.date).toLocaleString() : '',
                order && order.status ? order.status : '',
                total.toFixed(2),
                `"${items}"` // Wrap items in quotes to handle commas
            ];
            csvContent += row.join(',') + "\n";
        } catch (err) {
            console.error('Error exporting order to CSV, skipping order:', err, order);
        }
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "customer_orders.csv");
    document.body.appendChild(link); 
    link.click(); 
    document.body.removeChild(link);
    alert('Orders exported successfully!');
}
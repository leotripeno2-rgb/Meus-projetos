let cart = JSON.parse(localStorage.getItem('dodoca_cart')) || [];

const bulldogGifs = [
    'https://media0.giphy.com/media/tO0d44oEM8MLu/giphy.gif',
    'https://media1.tenor.com/m/TTfLNiTeQnsAAAAd/dog-pup.gif',
    'https://media1.tenor.com/m/gltwWQuK0R8AAAAd/dancing-pibble-dancing-french-bulldog.gif',
    'https://media1.tenor.com/m/w_v3DJb-Hh8AAAAd/pibble-dance.gif'
];

document.addEventListener('DOMContentLoaded', () => {
    const imgs = document.querySelectorAll('.random-bulldog');
    imgs.forEach(img => {
        const randomGif = bulldogGifs[Math.floor(Math.random() * bulldogGifs.length)];
        img.src = randomGif;
    });

    const defaultCategory = 'cafe';
    const tabs = document.querySelectorAll('.category-tab');
    tabs.forEach(tab => tab.addEventListener('click', () => setCategory(tab.dataset.category)));
    if (tabs.length) setCategory(defaultCategory);
});

function setCategory(category) {
    const tabs = document.querySelectorAll('.category-tab');
    const cards = document.querySelectorAll('.product-card');
    const title = document.getElementById('category-title');
    const labels = {
        cafe: 'Melhores Cafés',
        salgados: 'Salgados Saborosos',
        doce: 'Doces Delícias'
    };

    tabs.forEach(tab => tab.classList.toggle('active', tab.dataset.category === category));
    cards.forEach(card => {
        card.style.display = card.dataset.category === category ? 'block' : 'none';
    });
    if (title) title.querySelector('h4').innerText = labels[category] || 'Nosso Cardápio';
}

function updateUI() {
    const itemsFlow = document.getElementById('cart-items-flow');
    const totalVal = document.getElementById('total-val');
    const cartCount = document.getElementById('cart-count');

    if (!itemsFlow) return;

    itemsFlow.innerHTML = '';
    let total = 0, count = 0;

    cart.forEach((item, index) => {
        total += item.price * item.qty;
        count += item.qty;
        itemsFlow.innerHTML += `
            <div class="cart-item">
                <span><b>${item.qty}x</b> ${item.name}</span>
                <span>R$ ${(item.price * item.qty).toFixed(2)} 
                <button onclick="removeItem(${index})" style="color:red; margin-left:10px; border:none; background:none; cursor:pointer">×</button></span>
            </div>`;
    });

    totalVal.innerText = `R$ ${total.toFixed(2)}`;
    cartCount.innerText = count;
    localStorage.setItem('dodoca_cart', JSON.stringify(cart));
}

window.removeItem = (index) => {
    cart.splice(index, 1);
    updateUI();
};

document.addEventListener('click', (e) => {
    const sidebar = document.getElementById('cart-sidebar');
    const overlay = document.getElementById('overlay');

    if (e.target.id === 'open-cart' || e.target.id === 'close-cart' || e.target === overlay) {
        sidebar.classList.toggle('active');
        overlay.style.display = sidebar.classList.contains('active') ? 'block' : 'none';
    }

    if (e.target.classList.contains('add-to-cart-quick')) {
        const card = e.target.closest('.product-card');
        const product = {
            id: card.dataset.id,
            name: card.dataset.nome,
            price: parseFloat(card.dataset.preco),
            qty: 1
        };

        const exists = cart.find(i => i.id === product.id);
        if (exists) exists.qty++;
        else cart.push(product);
        
        updateUI();

        const notif = document.getElementById('notification');
        notif.style.transform = 'translateY(0)';
        setTimeout(() => notif.style.transform = 'translateY(200%)', 2500);
    }
});

document.getElementById('checkout-form').onsubmit = (e) => {
    e.preventDefault();
    if (cart.length === 0) return alert("O carrinho está vazio!");
    let msg = `*CAFÉ DA DODOCA - PEDIDO*\n\n`;
    cart.forEach(i => msg += `• ${i.qty}x ${i.name}\n`);
    msg += `\n*TOTAL:* ${document.getElementById('total-val').innerText}`;
    window.open(`https://wa.me/5511999999999?text=${encodeURIComponent(msg)}`);
};

updateUI();
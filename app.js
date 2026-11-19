const aromas = [
  {
    id: 'capim', label: 'Capim-limão', color: '#41512f', image: 'vela-capim',
    alt: 'Vela de capim-limão em pote de vidro com tampa de madeira.',
    labelImage: 'rotulo-capim',
  },
  {
    id: 'maca', label: 'Maçã e canela', color: '#732a32', image: 'vela-maca',
    alt: 'Vela de maçã e canela em pote de vidro com tampa de madeira.',
    labelImage: 'rotulo-maca',
  },
];

const products = [
  {
    id: 'bandeja', type: 'kits', category: 'Kit de decoração', name: 'Bandeja natalina',
    description: 'Um conjunto completo para compor a mesa de Natal.',
    details: 'Inclui bandeja, duas árvores de tamanhos diferentes, soldadinho, vasinho e raminho natalino.',
    price: { cents: 18990, kind: 'suggested' },
    option: 'Cor', optionPlural: 'combinações', photoPosition: 'center 58%',
    variants: [
      { id: 'verde', label: 'Verde e areia', color: '#38533a', image: 'bandeja-verde-720', alt: 'Bandeja verde e areia com árvores, soldadinho e arranjo.' },
      { id: 'bordo', label: 'Bordô e bege', color: '#792934', image: 'bandeja-bordo', alt: 'Bandeja bordô e bege com árvores, soldadinho e arranjo.' },
      { id: 'cappuccino', label: 'Bordô e cappuccino', color: '#9a755d', image: 'bandeja-cappuccino', alt: 'Bandeja bordô e marrom cappuccino com árvores, soldadinho e arranjo.' },
      { id: 'terracota', label: 'Terracota e bege', color: '#a65337', image: 'bandeja-terracota', alt: 'Bandeja terracota e bege com árvores, soldadinho e arranjo.' },
    ],
  },
  {
    id: 'arvore-familia', type: 'enfeites', category: 'Enfeite personalizado', name: 'Árvore da Família',
    description: 'Uma árvore com os nomes da família e estrela em bronze.',
    details: 'Os nomes formam a silhueta da árvore. Nesta prévia, você pode guardar a combinação de cores que preferir.',
    option: 'Cor', optionPlural: 'combinações', photoPosition: 'center 48%',
    variants: [
      { id: 'palha', label: 'Bordô e palha', color: '#792934', image: 'arvore-palha', alt: 'Árvore de nomes em bordô e palha, com estrela em bronze.' },
      { id: 'verde', label: 'Verde militar e palha', color: '#566041', image: 'arvore-verde', alt: 'Árvore de nomes em verde militar e palha, com estrela em bronze.' },
      { id: 'vinho', label: 'Vinho e verde militar', color: '#5b2c35', image: 'arvore-vinho', alt: 'Árvore de nomes em vinho e verde militar, com estrela em bronze.' },
    ],
  },
  {
    id: 'um-gesto', type: 'kits', category: 'Kit para presente', name: 'Kit Um Gesto',
    description: 'Uma vela aromática e um cartão para presentear.',
    details: 'Monte sua seleção com o aroma que você prefere para a vela do kit.',
    price: { cents: 6900, kind: 'reference' },
    option: 'Aroma', optionPlural: 'aromas',
    variants: aromas.map(aroma => ({
      ...aroma, image: 'kit-um-gesto', alt: 'Composição ilustrativa do kit com vela aromática e cartão.',
      labelImage: undefined,
    })),
  },
  {
    id: 'vela', type: 'velas', category: 'Vela aromática', name: 'Vela Boas Festas',
    description: 'Vela em vidro com tampa de madeira e rótulo natalino.',
    details: 'Capim-limão com rótulo verde ou maçã e canela com rótulo vinho. Os dois rótulos têm detalhes dourados.',
    option: 'Aroma', optionPlural: 'aromas',
    variants: aromas,
  },
];

const priceLabels = { suggested: 'Sugestão a confirmar', reference: 'Referência a confirmar' };
const asset = name => `${name}.webp`;
const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const money = cents => currency.format(cents / 100);
const $ = selector => document.querySelector(selector);
const storageKey = 'sol-de-ca-natal-2026-selection';
const keyFor = (product, variant) => `${product.id}:${variant.id}`;
const maxQuantity = 99;
const closeIcon = '<svg class="icon" aria-hidden="true" viewBox="0 0 24 24"><path d="m6 6 12 12M18 6 6 18"/></svg>';
const heartIcon = '<svg class="icon" aria-hidden="true" viewBox="0 0 24 24"><path d="M12 20.5 4.3 13a5 5 0 0 1 7.7-6.3 5 5 0 0 1 7.7 6.3Z"/></svg>';
const productLookup = new Map(products.flatMap(product =>
  product.variants.map(variant => [keyFor(product, variant), { product, variant }])
));

const grid = $('#products');
const typeFilter = $('#type-filter');
const priceFilter = $('#price-filter');
const productDialog = $('#product-dialog');
const selectionDialog = $('#selection-dialog');
const detail = $('#product-detail');
const selectionToggle = $('#open-selection');
const selectionItems = $('#selection-items');

let selected = {};
let canPersist = true;
let openProduct;
let openVariant;
let labelVisible = false;
let announcementTimer;

function readSelection() {
  try {
    const parsed = JSON.parse(localStorage.getItem(storageKey));
    const entries = Object.entries(parsed ?? {}).filter(([key, qty]) =>
      productLookup.has(key) && Number.isInteger(qty) && qty > 0 && qty <= maxQuantity
    );
    selected = Object.fromEntries(entries);
  } catch {
    canPersist = false;
  }
}

function saveSelection() {
  try {
    localStorage.setItem(storageKey, JSON.stringify(selected));
    canPersist = true;
  } catch {
    canPersist = false;
  }
}

function priceHtml(price) {
  if (!price) return '<p class="price pending">Preço a confirmar</p>';
  const status = priceLabels[price.kind];
  return `<p class="price"><strong>${money(price.cents)}</strong>${status ? `<span>${status}</span>` : ''}</p>`;
}

function photoStyle(product) {
  return product.photoPosition ? `style="--photo-position: ${product.photoPosition}"` : '';
}

function swatch(variant) {
  return `<span class="swatch" aria-hidden="true" style="--swatch: ${variant.color}"></span>`;
}

const priceFilters = {
  all: () => true,
  to80: price => price && price.cents <= 8000,
  to150: price => price && price.cents > 8000 && price.cents <= 15000,
  above150: price => price && price.cents > 15000,
  pending: price => !price || Boolean(priceLabels[price.kind]),
};

function renderCatalog() {
  const type = typeFilter.querySelector('input:checked').value;
  const results = products.filter(product =>
    (type === 'all' || product.type === type) && priceFilters[priceFilter.value](product.price)
  );
  grid.innerHTML = results.map(product => {
    const photo = product.variants[0];
    return `<article class="product" aria-labelledby="title-${product.id}">
      <button class="product-photo" type="button" data-open="${product.id}" aria-label="Ver ${product.name}" aria-haspopup="dialog" ${photoStyle(product)}>
        <img src="${asset(photo.image)}" alt="${photo.alt}" width="600" height="480" loading="lazy">
      </button>
      <div class="product-copy">
        <span class="category">${product.category}</span>
        <h3 id="title-${product.id}">${product.name}</h3>
        <p class="product-description">${product.description}</p>
        <p class="variant-summary"><span class="swatches">${product.variants.map(swatch).join('')}</span> ${product.variants.length} ${product.optionPlural}</p>
        ${priceHtml(product.price)}
        <button class="button secondary" type="button" data-open="${product.id}" aria-label="Ver opções de ${product.name}" aria-haspopup="dialog">Ver opções</button>
      </div>
    </article>`;
  }).join('');
  $('#results-count').textContent = results.length === 1 ? '1 peça' : `${results.length} peças`;
  $('#empty-results').hidden = results.length > 0;
}

function announce(message) {
  clearTimeout(announcementTimer);
  const status = $('#status-message');
  status.textContent = '';
  announcementTimer = setTimeout(() => { status.textContent = message; }, 50);
}

function showProduct(product) {
  openProduct = product;
  openVariant = product.variants[0];
  labelVisible = false;
  detail.innerHTML = `
    <button class="icon-button detail-close" type="button" aria-label="Fechar detalhes" autofocus>${closeIcon}</button>
    <figure class="detail-photo" ${photoStyle(product)}><img width="600" height="600" alt=""><figcaption></figcaption></figure>
    <div class="detail-copy">
      <span class="category">${product.category}</span>
      <h2 id="detail-title">${product.name}</h2>
      <p>${product.details}</p>
      ${priceHtml(product.price)}
      <fieldset class="detail-options">
        <legend>${product.option}</legend>
        ${product.variants.map(variant => `<button class="button secondary variant-option" data-variant="${variant.id}" type="button" aria-pressed="false">${swatch(variant)} ${variant.label}</button>`).join('')}
      </fieldset>
      ${product.variants.some(variant => variant.labelImage) ? '<button class="photo-control" type="button" id="switch-label" aria-pressed="false">Ver rótulo de Natal</button>' : ''}
      <button id="add-selection" class="button primary" type="button">${heartIcon} Guardar na seleção</button>
      <p id="detail-feedback" class="detail-ack" role="status"></p>
      <button id="detail-view-selection" class="button secondary" type="button" aria-haspopup="dialog" hidden>Ver minha seleção</button>
    </div>`;
  updateDetail();
  productDialog.showModal();
  productDialog.scrollTop = 0;
}

function updateDetail() {
  const photo = detail.querySelector('img');
  const switchLabel = detail.querySelector('#switch-label');
  photo.src = asset(labelVisible ? openVariant.labelImage : openVariant.image);
  photo.alt = labelVisible ? `Rótulo natalino Boas Festas, ${openVariant.label}.` : openVariant.alt;
  detail.querySelector('.detail-photo').classList.toggle('show-label', labelVisible);
  detail.querySelector('figcaption').textContent = labelVisible ? 'Rótulo de Natal' : 'Imagem ilustrativa';
  detail.querySelectorAll('[data-variant]').forEach(button => {
    button.setAttribute('aria-pressed', String(button.dataset.variant === openVariant.id));
  });
  if (switchLabel) {
    switchLabel.setAttribute('aria-pressed', String(labelVisible));
    switchLabel.textContent = labelVisible ? 'Ver imagem da vela' : 'Ver rótulo de Natal';
  }
}

function setQuantity(key, quantity) {
  if (quantity > 0) selected[key] = Math.min(maxQuantity, quantity);
  else delete selected[key];
  saveSelection();
  renderSelection();
}

function renderSelection() {
  const entries = Object.entries(selected);
  const count = entries.reduce((total, [, quantity]) => total + quantity, 0);
  $('#selection-count').textContent = count;
  selectionToggle.setAttribute('aria-label', `Minha seleção, ${count} ${count === 1 ? 'item' : 'itens'}`);
  $('#storage-note').textContent = canPersist ? 'Sua seleção fica salva neste navegador.' : 'Sua seleção está disponível enquanto esta página estiver aberta.';
  const summary = $('#selection-summary');
  summary.hidden = entries.length === 0;

  if (!entries.length) {
    selectionItems.innerHTML = '<div class="selection-empty"><h3>Sua seleção está vazia</h3><p>Abra um produto e guarde a combinação que mais gostou.</p></div>';
    summary.replaceChildren();
    return;
  }

  let subtotal = 0;
  let pending = 0;
  let provisional = false;
  const rows = entries.map(([key, quantity]) => {
    const { product, variant } = productLookup.get(key);
    const name = `${product.name}, ${variant.label}`;
    if (product.price) {
      subtotal += quantity * product.price.cents;
      provisional ||= Boolean(priceLabels[product.price.kind]);
    } else pending += quantity;
    return `<li class="selection-item">
      <img src="${asset(variant.image)}" alt="" width="70" height="75" ${photoStyle(product)}>
      <div>
        <h3>${product.name}</h3>
        <p class="item-option">${variant.label}</p>
        ${priceHtml(product.price)}
        <div class="qty" role="group" aria-label="Quantidade de ${name}">
          <button class="icon-button" type="button" data-key="${key}" data-action="minus" aria-label="Diminuir quantidade de ${name}" ${quantity === 1 ? 'disabled' : ''}>−</button>
          <span aria-label="Quantidade">${quantity}</span>
          <button class="icon-button" type="button" data-key="${key}" data-action="plus" aria-label="Aumentar quantidade de ${name}" ${quantity === maxQuantity ? 'disabled' : ''}>+</button>
        </div>
      </div>
      <button class="remove" type="button" data-key="${key}" data-action="remove" aria-label="Remover ${name}">Remover</button>
    </li>`;
  });
  selectionItems.innerHTML = `<ul class="selection-list">${rows.join('')}</ul>`;
  summary.innerHTML = `
    ${subtotal > 0 ? `<p>${provisional ? 'Subtotal de referência' : 'Subtotal'} <strong>${money(subtotal)}</strong></p>` : ''}
    ${pending ? `<p>${pending === 1 ? '1 item sem valor informado' : `${pending} itens sem valor informado`}</p>` : ''}`;
}

function showSelection() {
  renderSelection();
  selectionDialog.showModal();
  selectionDialog.scrollTop = 0;
}

function closeOnBackdrop(dialog) {
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right ||
        event.clientY < bounds.top || event.clientY > bounds.bottom) {
      dialog.close();
    }
  });
}

typeFilter.addEventListener('change', renderCatalog);
priceFilter.addEventListener('change', renderCatalog);

$('#reset-filters').addEventListener('click', () => {
  typeFilter.querySelector('input[value="all"]').checked = true;
  priceFilter.value = 'all';
  renderCatalog();
  typeFilter.querySelector('input[value="all"]').focus();
});

grid.addEventListener('click', event => {
  const button = event.target.closest('[data-open]');
  if (!button) return;
  showProduct(products.find(product => product.id === button.dataset.open));
});

productDialog.addEventListener('click', event => {
  const button = event.target.closest('button');
  if (!button) return;
  if (button.matches('.detail-close')) productDialog.close();

  if (button.dataset.variant) {
    openVariant = openProduct.variants.find(variant => variant.id === button.dataset.variant);
    updateDetail();
    $('#detail-feedback').textContent = '';
  }

  if (button.id === 'switch-label') {
    labelVisible = !labelVisible;
    updateDetail();
  }

  if (button.id === 'add-selection') {
    const key = keyFor(openProduct, openVariant);
    const quantity = selected[key] ?? 0;
    if (quantity === maxQuantity) {
      $('#detail-feedback').textContent = 'Você atingiu o limite desta opção na seleção.';
      return;
    }
    setQuantity(key, quantity + 1);
    $('#detail-feedback').textContent = `${openVariant.label} · ${selected[key]} na sua seleção.`;
    $('#detail-view-selection').hidden = false;
  }

  if (button.id === 'detail-view-selection') {
    productDialog.close();
    showSelection();
  }
});

selectionToggle.addEventListener('click', showSelection);
$('.close-selection').addEventListener('click', () => selectionDialog.close());
$('#continue').addEventListener('click', () => selectionDialog.close());

selectionItems.addEventListener('click', event => {
  const button = event.target.closest('[data-key]');
  if (!button) return;
  const { key, action } = button.dataset;
  const nextQty = action === 'remove' ? 0 : selected[key] + (action === 'plus' ? 1 : -1);
  setQuantity(key, nextQty);
  const rowButton = selectionItems.querySelector(`[data-key="${key}"][data-action="${action}"]:not(:disabled)`);
  const fallback = selectionItems.querySelector(`[data-key="${key}"][data-action="remove"]`);
  const target = rowButton ?? fallback ?? selectionItems.querySelector('.remove') ?? $('#continue');
  target.focus();
  const { product, variant } = productLookup.get(key);
  announce(nextQty ? `${product.name}, ${variant.label}, quantidade ${nextQty}.` : `${product.name}, ${variant.label}, removido da seleção.`);
});

for (const dialog of [productDialog, selectionDialog]) closeOnBackdrop(dialog);

window.addEventListener('storage', event => {
  if (event.key !== storageKey && event.key !== null) return;
  readSelection();
  renderSelection();
});

readSelection();
renderCatalog();
renderSelection();

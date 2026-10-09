const state = {
  currencies: [],
  fromCode: 'RUB',
  toCode: 'USD',
  activeSide: 'from',
};

const converterScreen = document.querySelector('#converterScreen');
const currencyScreen = document.querySelector('#currencyScreen');

const fromAmount = document.querySelector('#fromAmount');
const toAmount = document.querySelector('#toAmount');

const fromCode = document.querySelector('#fromCode');
const fromName = document.querySelector('#fromName');
const toCode = document.querySelector('#toCode');
const toName = document.querySelector('#toName');

const currencyList = document.querySelector('#currencyList');
const searchInput = document.querySelector('#searchInput');
const clearSearch = document.querySelector('#clearSearch');

const clearButton = document.querySelector('#clearButton');
const deleteButton = document.querySelector('#deleteButton');

const API_URL = 'https://www.cbr-xml-daily.ru/daily_json.js';

const fallbackCurrencies = [
  { CharCode: 'RUB', ID: 'R01014F', Name: 'Российский рубль', Nominal: 1, NumCode: '643', Value: 1 },
  { CharCode: 'USD', ID: 'R01235', Name: 'Доллар США', Nominal: 1, NumCode: '840', Value: 80 },
  { CharCode: 'EUR', ID: 'R01239', Name: 'Евро', Nominal: 1, NumCode: '978', Value: 93 },
  { CharCode: 'BYN', ID: 'R01090B', Name: 'Белорусский рубль', Nominal: 1, NumCode: '933', Value: 25 },
  { CharCode: 'AMD', ID: 'R01060', Name: 'Армянский драм', Nominal: 100, NumCode: '051', Value: 21 }
];

async function loadCurrencies() {
  try {
    const response = await fetch(API_URL);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    state.currencies = [
      {
        CharCode: 'RUB',
        ID: 'R01014F',
        Name: 'Российский рубль',
        Nominal: 1,
        NumCode: '643',
        Value: 1
      },
      ...Object.values(data.Valute)
    ];

  } catch (error) {
    console.warn(error);
    state.currencies = fallbackCurrencies;
  }

  updateCurrencyLabels();
  renderCurrencyList();
  convertFromActive();
}

function getCurrencySymbol(code) {
  const symbols = {
    RUB: '₽',
    USD: '$',
    EUR: '€',
    BYN: 'Br',
    AMD: '֏',
    GBP: '£',
    CNY: '¥',
    JPY: '¥',
    KZT: '₸',
  };

  return symbols[code] || code;
}
function getCurrency(code) {
  return state.currencies.find(currency => currency.CharCode === code);
}

function updateCurrencyLabels() {
  const from = getCurrency(state.fromCode);
  const to = getCurrency(state.toCode);

  if (!from || !to) return;

  fromCode.textContent = from.CharCode;
  fromName.textContent = from.Name;

  toCode.textContent = to.CharCode;
  toName.textContent = to.Name;

  document.querySelector('#fromSymbol').textContent =
    getCurrencySymbol(state.fromCode);

  document.querySelector('#toSymbol').textContent =
    getCurrencySymbol(state.toCode);
}
function parseAmount(value) {
  const normalized = value.replace(',', '.');
  const number = Number(normalized);
  return Number.isFinite(number) ? number : 0;
}

function formatAmount(value) {
  if (!Number.isFinite(value)) return '';
  return String(Number(value.toFixed(2))).replace('.', ',');
}

function convertAmount(amount, source, target) {
  if (!source || !target) return 0;

  const rubles = amount * (source.Value / source.Nominal);

  return rubles / (target.Value / target.Nominal);
}

function convertFromActive() {
  const from = getCurrency(state.fromCode);
  const to = getCurrency(state.toCode);

  if (!from || !to) return;

  if (state.activeSide === 'from') {
    const amount = parseAmount(fromAmount.value);
    toAmount.value = formatAmount(convertAmount(amount, from, to));
  } else {
    const amount = parseAmount(toAmount.value);
    fromAmount.value = formatAmount(convertAmount(amount, to, from));
  }
}

function setActiveSide(side) {
  state.activeSide = side;

  fromAmount.classList.toggle('active', side === 'from');
  toAmount.classList.toggle('active', side === 'to');

  convertFromActive();
}

function openCurrencySelector(side) {
  state.activeSide = side;
  searchInput.value = '';
  renderCurrencyList();

  converterScreen.classList.add('hidden');
  currencyScreen.classList.remove('hidden');

  searchInput.focus();
}

function closeCurrencySelector() {
  currencyScreen.classList.add('hidden');
  converterScreen.classList.remove('hidden');
}

function selectCurrency(code) {
  if (state.activeSide === 'from') {
    if (code === state.toCode) {
      state.toCode = state.fromCode;
    }
    state.fromCode = code;
  } else {
    if (code === state.fromCode) {
      state.fromCode = state.toCode;
    }
    state.toCode = code;
  }

  updateCurrencyLabels();
  renderCurrencyList();
  closeCurrencySelector();
  convertFromActive();
}

function renderCurrencyList() {
  const query = searchInput.value.trim().toLowerCase();

  const filtered = state.currencies.filter(currency =>
    currency.CharCode.toLowerCase().includes(query) ||
    currency.Name.toLowerCase().includes(query)
  );

  currencyList.innerHTML = '';

  if (filtered.length === 0) {
    currencyList.innerHTML = '<div class="empty-result">Валюта не найдена</div>';
    return;
  }

  filtered.forEach(currency => {
    const selected = currency.CharCode === state.fromCode || currency.CharCode === state.toCode;

    const option = document.createElement('div');
    option.className = `currency-option${selected ? ' selected' : ''}`;

    option.innerHTML = `
      <div>
        <strong>${currency.CharCode}</strong>
        <span>${currency.Name}</span>
      </div>
      <span class="check">${selected ? '✓' : ''}</span>
    `;

    option.addEventListener('click', () => selectCurrency(currency.CharCode));

    currencyList.appendChild(option);
  });
}

document.querySelectorAll('.digit').forEach(button => {
  button.addEventListener('click', () => {
    const input = state.activeSide === 'from' ? fromAmount : toAmount;
    const value = button.dataset.value;

    if (value === ',' && input.value.includes(',')) {
      return;
    }

    if (input.value === '0' && value !== ',') {
      input.value = value;
    } else {
      input.value += value;
    }

    convertFromActive();
  });
});

clearButton.addEventListener('click', () => {
  const input = state.activeSide === 'from' ? fromAmount : toAmount;
  input.value = '';
  convertFromActive();
});

deleteButton.addEventListener('click', () => {
  const input = state.activeSide === 'from' ? fromAmount : toAmount;
  input.value = input.value.slice(0, -1);
  convertFromActive();
});

fromAmount.addEventListener('focus', () => setActiveSide('from'));
toAmount.addEventListener('focus', () => setActiveSide('to'));

fromAmount.addEventListener('click', () => setActiveSide('from'));
toAmount.addEventListener('click', () => setActiveSide('to'));

document.querySelector('#fromCurrencyButton').addEventListener('click', () => {
  openCurrencySelector('from');
});

document.querySelector('#toCurrencyButton').addEventListener('click', () => {
  openCurrencySelector('to');
});

document.querySelector('#backButton').addEventListener('click', closeCurrencySelector);


searchInput.addEventListener('input', () => {
  renderCurrencyList();
});

searchInput.addEventListener('change', () => {
  renderCurrencyList();
});

fromAmount.addEventListener('input', () => {
  setActiveSide('from');
});

toAmount.addEventListener('input', () => {
  setActiveSide('to');
});

loadCurrencies();

import { uid, Faker } from 'react-mock';

export const reports = [
  {
    id: 1,
    name: 'Продажи',
    description: 'Поиск по Продажам',
    fields: [
		{ id: 1, name: 'Сеть', key: 'Group_Name' },
		{ id: 2, name: 'Аптека', key: 'Ph_Name' },
		{ id: 3, name: 'Дата', type: 'date', key: 'dat' },
		{ id: 4, name: 'Наименование', key: 'G_name' },
		{ id: 5, name: 'ШК', key: 'Barcode' },
		{ id: 6, name: 'Количество', type: 'number', key: 'Qty' },
		{ id: 4, name: 'Цена', type: 'number', key: 'Price' },
        { id: 4, name: 'Сумма', type: 'number', key: 'Sm'},
		{ id: 5, name: 'ШК', key: 'Barcode' },
		{ id: 6, name: 'Позиций', type: 'number', key: 'QtyPos' }
    ]
  },
  {
    id: 2,
    name: 'Остатки',
    description: 'Поиск по Остаткам',
    fields: [
        { id: 1, name: 'Сеть', key: 'Group_Name'},
        { id: 2, name: 'Аптека', key: 'Ph_Name' },
        { id: 3, name: 'Дата', type: 'date', key: 'Dat' },
        { id: 4, name: 'Наименование', key: 'G_name' },
        { id: 5, name: 'Количество', type: 'number', key: 'Qty' },
        { id: 6, name: 'ШК', key: 'Barcode'}
    ]
  }
];

export const getReportData = function (id) {
  const report = reports.find(item => item.id == id);
  let res = [];
  const getFakeValue = (type) => {
    let value = '';
    switch (type) {
      case 'date':
        value = Faker.date.past();
        break;
      case 'number':
        value = Faker.finance.amount();
        break;
      case 'boolean':
        value = Faker.random.boolean();
        break;
      default:
        value = Faker.random.word();
    }
    return value;
  };
  for (let i = 0; i < 10; i++) {
    const obj = {};
    report.fields.forEach(item => {
      obj[item.key] = getFakeValue(item.type);
    });
    res.push(obj);
  }
  return res;
};

const storedReports = localStorage.getItem('reports');
export const savedReports = storedReports ? JSON.parse(storedReports) : [];

export const addReport = function (id, data) {
  data.id = uid.next();
  const report = reports.find(item => item.id == id);
  data.report = {
    id,
    name: report ? report.name : ''
  };
  data.created = new Date();
  data.status = {
    id: 1,
    name: 'В обработке'
  };
  savedReports.push(data);
  localStorage.setItem('reports', JSON.stringify(savedReports));
  return data;
};

export const deleteReport = function (id) {
  const found = savedReports.find(item => item.id == id);
  savedReports.splice(savedReports.indexOf(found), 1);
  localStorage.setItem('reports', JSON.stringify(savedReports));
};

const storedRequests = localStorage.getItem('requests');
export const requests = storedRequests ? JSON.parse(storedRequests) : [];

export const addRequest = function (id, data) {
  data.id = uid.next();
  const report = reports.find(item => item.id == id);
  data.report = {
    id,
    name: report ? report.name : ''
  };
  data.created = new Date();
  requests.push(data);
  localStorage.setItem('requests', JSON.stringify(requests));
  return data;
};

export const getRequest = function (id) {
  return requests.find(item => item.id == id);
};

export const deleteRequest = function (id) {
  const found = requests.find(item => item.id == id);
  requests.splice(requests.indexOf(found), 1);
  localStorage.setItem('requests', JSON.stringify(requests));
};
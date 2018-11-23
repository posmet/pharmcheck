import { uid, Faker } from 'react-mock';

export const reports = [
  {
    id: 1,
    name: 'Тип 1',
    description: 'Поиск по Тип 1',
    fields: [
      {id: 1, name: 'Номер заказа', key: 'number'},
      {id: 2, name: 'Дата', type: 'date', key: 'date'},
      {id: 3, name: 'Количество', type: 'number', key: 'count'},
      {id: 4, name: 'Оплачен', type: 'boolean', key: 'payed'}
    ]
  },
  {
    id: 2,
    name: 'Тип 2',
    description: 'Поиск по Тип 2',
    fields: [
      {id: 1, name: 'Акция', key: 'promotion'},
      {id: 2, name: 'Дата завершения', type: 'date', key: 'date'},
      {id: 3, name: 'Кол-во на складе', type: 'number', key: 'count'},
      {id: 4, name: 'Оплачен', type: 'boolean', key: 'payed'}
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
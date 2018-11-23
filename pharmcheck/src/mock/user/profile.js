import { Server, Faker, uid } from 'react-mock';
import { errorFormat } from '../data';

const host = process.env.HOST;
const apiRoute = `${host}/api/profile`;
const requestHandler = (request, generator) => {
  const { authorization } = request.requestHeaders;
  if (!authorization) {
    return [401, { 'Content-Type': 'application/json' }, JSON.stringify(errorFormat("Неверный токен авторизации"))];
  }
  return [200, { 'Content-Type': 'application/json' }, JSON.stringify(successFormat)];
};

const successFormat = {
  id: 1,
  name: 'Admin'
};

Server.mockGet(apiRoute, requestHandler);
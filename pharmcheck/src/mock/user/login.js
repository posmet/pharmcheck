import { Server, Faker, uid } from 'react-mock';
import { errorFormat } from '../data';

const host = process.env.HOST;
const apiRoute = `${host}/api/login`;
const requestHandler = (request, generator) => {
  const body = JSON.parse(request.requestBody);
  if (body.login !== 'admin' || body.password !== 'admin') {
    return [500, { 'Content-Type': 'application/json' }, JSON.stringify(errorFormat("Неверный логин или пароль"))];
  }
  return [200, { 'Content-Type': 'application/json' }, JSON.stringify(successFormat)];
};

const successFormat = {
  token: Faker.internet.userName(),
};

Server.mockPost(apiRoute, requestHandler);
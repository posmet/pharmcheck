import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope } from '@fortawesome/free-regular-svg-icons';
import { faKey } from '@fortawesome/free-solid-svg-icons';
import {errorHandler} from '@utils/Api';
import { Button, FormGroup } from 'react-bootstrap';
import { Formik } from 'formik';
import InputGroup from '@components/common/InputGroup';
import * as Yup from 'yup';

const Schema = Yup.object().shape({
  login: Yup.string()
    .required('Required'),
  password: Yup.string()
    .required('Required'),
});

@inject('UserStore', 'RoutingStore', 'AppStore')
@observer
class Login extends Component {

  state = {
    login: '',
    password: '',
    remember: true
  };

  onSubmit = (values, actions) => {
    const { props } = this;
    const { UserStore, RoutingStore, AppStore } = props;
    const { login, password, remember } = values;
    const body = {
      login,
      password
    };
    UserStore.login(body)
      .then(({body}) => {
        const { token } = body;
        return UserStore.profile()
          .then(() => {
            AppStore.setToken(token, remember);
            RoutingStore.push('/');
          });
      })
      .catch(() => {});
  };

  render() {
    const { state, onSubmit, props } = this;
    const { UserStore } = props;
    const { loading } = UserStore;
    return (
      <Formik
        initialValues={state}
        validationSchema={Schema}
        onSubmit={onSubmit}
        render={({values, touched, errors, handleSubmit, handleChange, handleBlur, submitCount}) => {
          const loginAttrs = {
            type: "text",
            placeholder: "Логин",
            icon: <FontAwesomeIcon icon={faEnvelope} />,
            leftPosition: true,
            value: values.login,
            name: 'login',
            onChange: handleChange,
            onSubmit: handleSubmit,
            onBlur: handleBlur,
            invalid: touched.login && errors.login || submitCount > 0 && errors.login
          };
          const passwordAttrs = {
            type: "password",
            placeholder: "Пароль",
            icon: <FontAwesomeIcon icon={faKey} />,
            leftPosition: true,
            value: values.password,
            name: 'password',
            onChange: handleChange,
            onSubmit: handleSubmit,
            onBlur: handleBlur,
            invalid: touched.password && errors.password || submitCount > 0 && errors.password
          };
          return (
            <form noValidate className="login-container" onSubmit={handleSubmit}>
              <div className="login-container__header">Pharmacheck</div>

              <FormGroup>
                <InputGroup {...loginAttrs} />
              </FormGroup>
              <FormGroup>
                <InputGroup {...passwordAttrs} />
              </FormGroup>
              <div className="login-container__remember">
                <label>
                  <input type="checkbox" name="remember" checked={values.remember} onChange={handleChange}/>
                  Запомнить меня
                </label>
              </div>
              <Button type="submit" variant="outline-success" disabled={loading}>
                Вход
              </Button>
            </form>
          )
        }}
      />
    );
  }
}

export default Login;
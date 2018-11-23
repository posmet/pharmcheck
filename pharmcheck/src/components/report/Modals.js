import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars } from '@fortawesome/free-solid-svg-icons';
import { Modal, Button, Form, FormGroup, ButtonGroup } from 'react-bootstrap';
import { observable, toJS } from 'mobx';
import * as Yup from 'yup';
import { Formik } from 'formik';
import InputGroup from '@components/common/InputGroup';

const Schema = Yup.object().shape({
  name: Yup.string()
    .required('Required')
});

@observer
export class SettingsModal extends Component {

  @observable checkboxes = [];

  constructor(props) {
    super(props);
    this.setCheckboxes(props);
  }

  setCheckboxes(props) {
    const {fields, saved} = props;
    this.checkboxes = fields.map(({id, name, ...f}) => {
      return {
        id,
        name,
        checked: !saved.length || saved.some(item => item.id === id),
        ...f
      }
    });
  }

  componentWillReceiveProps(props) {
    this.setCheckboxes(props);
  }

  onSubmit = () => {
    const result = this.checkboxes.filter(item => item.checked);
    if (!result.length) {
      return false;
    }
    this.props.onSubmit(toJS(result));
  };

  render() {
    const { checkboxes, props, onSubmit } = this;
    const { show, onCancel } = props;

    return (
      <Modal show={show} onHide={onCancel} centered>
        <Modal.Body className="modal-settings">
          {
            checkboxes.map(row => {
              return (
                <Form.Check
                  key={row.id}
                  type="checkbox"
                  id={`checkbox-${row.id}`}
                  checked={row.checked}
                  onChange={() => row.checked = !row.checked}
                  label={row.name}
                />
              )
            })
          }
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={onCancel}>Отменить</Button>
          <Button variant="outline-success" onClick={onSubmit}>Сохранить</Button>
        </Modal.Footer>
      </Modal>
    );
  }
}

export class RequestModal extends Component {

  state = {
    name: '',
    description: ''
  };

  render() {
    const { state, props } = this;
    const { show, onCancel, onSubmit } = props;

    return (
      <Modal show={show} onHide={onCancel} centered>
        <Formik
          initialValues={state}
          validationSchema={Schema}
          onSubmit={onSubmit}
          render={({values, touched, errors, handleSubmit, handleChange, handleBlur, submitCount}) => {
            const nameAttrs = {
              type: "text",
              placeholder: "Название",
              value: values.name,
              name: 'name',
              onChange: handleChange,
              onSubmit: handleSubmit,
              onBlur: handleBlur,
              invalid: touched.name && errors.name || submitCount > 0 && errors.name
            };
            const descriptionAttrs = {
              type: "text",
              placeholder: "Описание",
              value: values.description,
              name: 'description',
              onChange: handleChange,
              onSubmit: handleSubmit,
              onBlur: handleBlur
            };
            return (
              <form noValidate onSubmit={handleSubmit}>
                <Modal.Body className="modal-request">
                <FormGroup>
                  <InputGroup {...nameAttrs} />
                </FormGroup>
                <FormGroup>
                  <InputGroup {...descriptionAttrs} />
                </FormGroup>
                </Modal.Body>
                <Modal.Footer>
                  <Button variant="outline-secondary" onClick={onCancel}>Отменить</Button>
                  <Button type='submit' variant="outline-success">Создать</Button>
                </Modal.Footer>
              </form>
            )
          }}
        />
      </Modal>
    );
  }
}

export class SaveModal extends Component {

  state = {
    name: '',
    description: '',
    format: 'xls'
  };

  render() {
    const { state, props } = this;
    const { show, onCancel, onSubmit } = props;

    return (
      <Modal show={show} onHide={onCancel} centered>
        <Formik
          initialValues={state}
          validationSchema={Schema}
          onSubmit={onSubmit}
          render={({values, touched, errors, handleSubmit, handleChange, handleBlur, submitCount, setFieldValue}) => {
            const nameAttrs = {
              type: "text",
              placeholder: "Название отчета",
              value: values.name,
              name: 'name',
              onChange: handleChange,
              onSubmit: handleSubmit,
              onBlur: handleBlur,
              invalid: touched.name && errors.name || submitCount > 0 && errors.name
            };
            const descriptionAttrs = {
              type: "text",
              placeholder: "Описание",
              value: values.description,
              name: 'description',
              onChange: handleChange,
              onSubmit: handleSubmit,
              onBlur: handleBlur
            };
            return (
              <form noValidate onSubmit={handleSubmit}>
                <Modal.Body className="modal-request">
                  <FormGroup>
                    <InputGroup {...nameAttrs} />
                  </FormGroup>
                  <FormGroup>
                    <InputGroup {...descriptionAttrs} />
                  </FormGroup>
                  <FormGroup>
                    <input type="radio" name="radioButtonSet" value="xls" checked={values.format === 'xls'} onChange={v => setFieldValue('format', 'xls')}/> XLS
                  </FormGroup>
                  <FormGroup>
                    <input type="radio" name="radioButtonSet" value='input2' checked={values.format === 'csv'} onChange={v => setFieldValue('format', 'csv')}/> CSV
                  </FormGroup>
                  <div>
                    <input type="radio" name="radioButtonSet" value='input3' checked={values.format === 'pdf'} onChange={v => setFieldValue('format', 'pdf')}/> PDF
                  </div>
                </Modal.Body>
                <Modal.Footer>
                  <Button variant="outline-secondary" onClick={onCancel}>Отменить</Button>
                  <Button type='submit' variant="outline-success">Создать</Button>
                </Modal.Footer>
              </form>
            )
          }}
        />
      </Modal>
    );
  }
}
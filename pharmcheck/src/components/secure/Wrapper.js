import React, { Component } from 'react';
import Header from '@components/secure/Header';
import Footer from '@components/secure/Footer';
import Sidebar from '@components/secure/Sidebar';
import { observer, inject } from 'mobx-react';

@inject('AppStore')
class Wrapper extends Component {



  render() {
    const {children, AppStore} = this.props;
    const {sidebar} = AppStore;
    return (
      <div className="page">
        { sidebar ? <Sidebar /> : null }
        <div className="page__content">
          <Header />
          <div className="page__content--body">
            {children}
          </div>
          <Footer />
        </div>
      </div>
    );
  }
}

export default Wrapper;
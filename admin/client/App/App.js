/**
 * The App component is the component that is rendered around all views, and
 * contains common things like navigation, footer, etc.
 */

import React, { Component } from 'react';
import { Container } from './elemental';
import { Link } from 'react-router';
import { css } from 'glamor';
import _ from 'lodash';

import MobileNavigation from './components/Navigation/Mobile';
import PrimaryNavigation from './components/Navigation/Primary';
import SecondaryNavigation from './components/Navigation/Secondary';
import Footer from './components/Footer';
import { rolePermissions } from '../constants';
// import { Header } from './components/Header';

import IframeContent from './shared/IframeContent';

const classes = {
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
  },
  header: {
    position: 'sticky',
    top: 0,
    backgroundColor: '#1385e5',
    color: 'white',
    zIndex: 1,
    minHeight: '40px',
  },
  cover: {
    objectFit: 'cover',
    minWidth: '180px',
    minHeight: '40px',
  },
  body: {
    flexGrow: 1,
  },
};

class App extends Component {
  constructor(props) {
    super(props);
    
    this.state = {
      userRoles: [],
      isSuperAdmin: false,
      loading: true, // To handle loading state
    };
    
    this.isRouteAllowed = this.isRouteAllowed.bind(this);
  }

  componentDidMount() {
    const apiHeaders = {
      headers: {
        'Cache-Control': 'no-cache',
        Authorization: Keystone.user.token, // Ensure Keystone.user is defined and accessible
      },
    };

    fetch('https://test.mojomanager.com/app/users/me', apiHeaders)
      .then((res) => {
        if (!res.ok) {
          throw new Error('Network response was not ok');
        }
        return res.json();
      })
      .then((userDetails) => {
        console.log('result-----userDetails:', userDetails);
        const { user } = userDetails;
        console.log('result-----USER:', user);

        this.setState({
          userRoles: user.rolesName,
          loading: false,
          isSuperAdmin: (user.role && user.role == "SuperAdmin") ? true : false
        });
      })
      .catch((e) => {
        console.error('USER ERR->>', e);
        this.setState({ loading: false });
        // Optionally, handle unauthorized access here
      });
  }

  /**
   * Helper function to determine if the current path is allowed for the user's roles
   * @param {string} currentPath - The current route path
   * @returns {boolean} - Returns true if the route is allowed, else false
   */
  isRouteAllowed(currentPath) {
    const { userRoles, isSuperAdmin } = this.state;
   
    if(isSuperAdmin){
      return true;
    }
    console.log("userRoles", userRoles)
    if(userRoles && userRoles.length > 0){
    for (let i = 0; i < userRoles.length; i++) {
      const role = userRoles[i];
      const allowedRoutes = rolePermissions[role] || [];
    console.log("rolePermissions", rolePermissions)
    console.log("allowedRoutes", allowedRoutes)

      for (let j = 0; j < allowedRoutes.length; j++) {
        const route = allowedRoutes[j];
        // Exact match; modify if you need pattern matching
        if (currentPath === route) {
          return true;
        }
      }
    }
  }
    return false;
  }

  render() {
    const { userRoles, loading } = this.state;
    const { children: propChildren, params, location } = this.props;

    const listsByPath = require('../utils/lists').listsByPath;
    let children = propChildren;

    console.log('listsByPath', listsByPath, 'props', this.props, 'WINDOWS:');
    console.log('Window:', window.location);
    console.log('Keystone.user:', Keystone.user);
    console.log('Keystone:', Keystone.user);

    // if (loading) {
    //   return <div>Loading...</div>;
    // }

    // If we're on either a list or an item view
    let currentList, currentSection;
    if (params.listId) {
      currentList = listsByPath[params.listId];
      const currentPath = location.pathname;

      // If we're on a list path that doesn't exist (e.g. /keystone/gibberishasfw34afsd) this will be undefined
      if (!currentList) {
        const section = _.find(Keystone.nav.sections, {
          lists: [{ path: currentPath, external: true }],
        });
        if (section) {
          const path = _.find(section.lists, { path: currentPath, external: true });
          console.log(path);
          children = (
            <IframeContent
              src={path.href}
              show={true}
              onCancel={() => {
                console.log('frame cancel');
              }}
              onSave={() => {
                console.log('frame save');
              }}
            />
          );
        } else {
          children = (
            <Container>
              <p>Page not found!</p>
              <Link to={`${Keystone.adminPath}`}>Go back home</Link>
            </Container>
          );
        }
      } else {
        console.log('ELSE1', !this.isRouteAllowed(params.listId));
        if (!this.isRouteAllowed(params.listId)) {
          children = (
            <Container>
              <p>Page not found!</p>
              <Link to={`${Keystone.adminPath}`}>Go back home</Link>
            </Container>
          );
        } else {
          // Get the current section we're in for the navigation
          currentSection = Keystone.nav.by.list[currentList.key];
        }
      }
    }

    // Default current section key to dashboard
    const currentSectionKey = (currentSection && currentSection.key) || 'dashboard';

    return (
      <div className={css(classes.wrapper)}>
        <div className={css(classes.header)}>
          <div style={{ minWidth: '180px', float: 'left' }}>
            <a href="/" title="Front page - Mojo Manager">
              <img
                width="175"
                height="40"
                src="../../secure/images/header_logo.png"
                alt="Logo"
              />
            </a>
          </div>
          <div
            style={{
              paddingLeft: '30px',
              float: 'left',
              fontFamily: "'Faster One', cursive",
              fontSize: '28px',
            }}
          >
            {Keystone.user.companyName}
          </div>
          <div style={{ float: 'right', paddingRight: '30px', paddingTop: '8px' }}>
            Signed in as, <b>{Keystone.user.name}</b>
            <a
              href="/secure/signout"
              style={{ paddingLeft: '16px', cursor: 'pointer', color: 'white' }}
            >
              Sign Out
            </a>
          </div>
        </div>
        <header>
          <MobileNavigation
            brand={Keystone.brand}
            currentListKey={params.listId}
            currentSectionKey={currentSectionKey}
            sections={Keystone.nav.sections}
            signoutUrl={Keystone.signoutUrl}
          />
          {/* <Header
            appversion={Keystone.appversion}
            backUrl={Keystone.backUrl}
            brand={Keystone.brand}
            User={Keystone.User}
            user={Keystone.user}
            version={Keystone.version}
          /> */}
          <PrimaryNavigation
            currentSectionKey={currentSectionKey}
            brand={Keystone.brand}
            sections={Keystone.nav.sections}
            signoutUrl={Keystone.signoutUrl}
          />
          {/* If a section is open currently, show the secondary nav */}
          {currentSection ? (
            <SecondaryNavigation
              currentListKey={params.listId}
              lists={currentSection.lists}
              itemId={params.itemId}
            />
          ) : null}
        </header>
        <main className={css(classes.body)}>{children}</main>
        <Footer
          appversion={Keystone.appversion}
          backUrl={Keystone.backUrl}
          brand={Keystone.brand}
          User={Keystone.User}
          user={Keystone.user}
          version={Keystone.version}
        />
      </div>
    );
  }
}

module.exports = App;

/**
 * The App component is the component that is rendered around all views, and
 * contains common things like navigation, footer, etc.
 */

import React from 'react';
import { Container } from './elemental';
import { Link } from 'react-router';
import { css } from 'glamor';
import _ from 'lodash';

import MobileNavigation from './components/Navigation/Mobile';
import PrimaryNavigation from './components/Navigation/Primary';
import SecondaryNavigation from './components/Navigation/Secondary';
import Footer from './components/Footer';
// import { Header } from './components/Header';

import IframeContent from './shared/IframeContent';

const classes = {
	wrapper: {
		display: 'flex',
		flexDirection: 'column',
		minHeight: '100vh',
	},
	header: {
		position: "sticky", 
		top: 0,
		backgroundColor: "#1385e5",
		color: "white",
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

const App = (props) => {
	const listsByPath = require('../utils/lists').listsByPath;
	let children = props.children;
	console.log("listsByPath", listsByPath, "props", props, "WINDOWS:")
	console.log("Window:", window.location)
	console.log("Keystone.user.token:", Keystone.user.token)
	fetch('http://localhost:3001/app/users/me').then(res=> res.json()).then(
		result => console.log("result-----USER:", result)
	).catch(e => console.log("USER ERR->>", e))
	// If we're on either a list or an item view
	let currentList, currentSection;
	if (props.params.listId) {
		currentList = listsByPath[props.params.listId];
		// If we're on a list path that doesn't exist (e.g. /keystone/gibberishasfw34afsd) this will
		// be undefined
		if (!currentList) {
			const section = _.find(Keystone.nav.sections, {lists: [{path: props.location.pathname, external: true}] })
			if (section) {
				const path = _.find(section.lists, {path: props.location.pathname, external: true});
				console.log(path);
				children = (<IframeContent src={path.href} show={true} onCancel={() => {
					console.log('frame cancel');
				}} onSave={() => {
					console.log('frame save');
				}} />)
			} else {
				children = (
					<Container>
						<p>Page not found!</p>
						<Link to={`${Keystone.adminPath}`}>
							Go back home
						</Link>
					</Container>
				);
			}
		} else {
			// Get the current section we're in for the navigation
			currentSection = Keystone.nav.by.list[currentList.key];
		}
	}
	// Default current section key to dashboard
	const currentSectionKey = (currentSection && currentSection.key) || 'dashboard';
	return (
		<div className={css(classes.wrapper)}>
			<div className={css(classes.header)}>
				<div style={{minWidth: '180px', float: 'left'}}>
					<a href="/" title="Front page - Mojo Manager">
						<img width="175" height="40" src="../../secure/images/header_logo.png"></img> 
					</a>
				</div>
				<div style={{paddingLeft: '30px', float: 'left', fontFamily: "'Faster One', cursive", fontSize: '28px'}}>
					{Keystone.user.companyName}
				</div>
				<div style={{float: 'right', paddingRight: '30px', paddingTop: '8px'}}>					
					Signed in as, <b>{Keystone.user.name}</b>
					<a href="/secure/signout" style={{paddingLeft: '16px', cursor: 'pointer', color: 'white'}}>Sign Out</a>  					
				</div>
				
			</div>		
			<header>				
				<MobileNavigation
					brand={Keystone.brand}
					currentListKey={props.params.listId}
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
				{(currentSection) ? (
					<SecondaryNavigation
						currentListKey={props.params.listId}
						lists={currentSection.lists}
						itemId={props.params.itemId}
					/>
				) : null}
			</header>
			<main className={css(classes.body)}>
				{children}
			</main>
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
};

module.exports = App;

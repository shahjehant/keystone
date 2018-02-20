/**
 * The form that's visible when "Create <ItemName>" is clicked on either the
 * List screen or the Item screen
 */

import React from 'react';

const IframeContent = React.createClass({
	displayName: 'IframeContent',
	propTypes: {
		show: React.PropTypes.bool,
		src: React.PropTypes.string,
		className: React.PropTypes.string,
		onCancel: React.PropTypes.func,
		onSave: React.PropTypes.func,
	},
	getDefaultProps () {
		return {
			show: false,
		};
	},
	getInitialState () {
		return {
		};
	},
	componentDidMount () {
		window.addEventListener("message", this.handleFrameTasks, this);
	},
	componentWillUnmount () {
		window.removeEventListener("message", this.handleFrameTasks, this);
	},
	handleFrameTasks(e){
		try{
			const message = JSON.parse(e.data);
			switch(message.type) {
				case 'contentUpdate': 
					this.setState({
						contentHeight: message.data
					})
					break;
				case 'onSave':
					if (this.props.onSave) {
						this.props.onSave(message.data);
					}
					break;
				case 'onCancel':
					if(this.props.onCancel) {
						this.props.onCancel();
					}
					break;
			}
		} catch (err) {
			console.error(err);
		}
	},
	renderContent() {
		const {src, show, className = ''} = this.props;
		const iframeURL = `${src}?token=${Keystone.user.token}`
		return show ?
			<iframe className={'content-frame ' + className} style={{height: this.state.contentHeight}} ref={(f) => this.ifr = f } src={iframeURL} /> : <div />
	},
	render () {
		return this.renderContent();
	},
});

module.exports = IframeContent;

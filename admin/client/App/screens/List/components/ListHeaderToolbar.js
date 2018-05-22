import React, { PropTypes } from 'react';
import {
	GlyphButton,
	InlineGroup as Group,
	InlineGroupSection as Section,
	ResponsiveText,
} from '../../../elemental';
import theme from '../../../../theme';
import Popout from '../../../shared/Popout';
import PopoutList from '../../../shared/Popout/PopoutList';
import ListColumnsForm from './ListColumnsForm';
import ListDownloadForm from './ListDownloadForm';
import ListHeaderSearch from './ListHeaderSearch';

import ListFiltersAdd from './Filtering/ListFiltersAdd';

function ButtonDivider({ style, ...props }) {
	props.style = {
		borderLeft: '1px solid rgba(0, 0, 0, 0.1)',
		paddingLeft: '0.75em',
		...style,
	};

	return <div {...props} />;
};

function CreateButton({ listName, onClick, ...props }) {
	return (
		<GlyphButton
			block
			color="success"
			data-e2e-list-create-button="header"
			glyph="plus"
			onClick={onClick}
			position="left"
			title={`Create ${listName}`}
			{...props}
		>
			<ResponsiveText
				visibleSM="Create"
				visibleMD="Create"
				visibleLG={`Create ${listName}`}
			/>
		</GlyphButton>
	);
};


var ListHeaderToolbar = React.createClass({
	displayName: 'ListHeaderToolbar',
	propTypes: {
		columnsActive: PropTypes.array,
		columnsAvailable: PropTypes.array,
		createIsAvailable: PropTypes.bool,
		createListName: PropTypes.string,
		createOnClick: PropTypes.func.isRequired,
		dispatch: PropTypes.func.isRequired,
		expandIsActive: PropTypes.bool,
		expandOnClick: PropTypes.func.isRequired,
		filtersActive: PropTypes.array,
		filtersAvailable: PropTypes.array,
		list: PropTypes.object,
		searchHandleChange: PropTypes.func.isRequired,
		searchHandleClear: PropTypes.func.isRequired,
		searchHandleKeyup: PropTypes.func.isRequired,
		customCreateButton: PropTypes.func.isRequired,
		searchValue: PropTypes.string,
	},
	getInitialState() {
		return {
			popoutIsOpen: false,
		};
	},
	closePopout() {
		this.setState({
			popoutIsOpen: false,
		});
	},
	handleCreateButtonOptions(action_type) {
		this.props.customCreateButton(action_type);
		this.setState({
			popoutIsOpen: false,
		});
	},
	render() {
		console.log('props', this.props.list)
		return (
			<span>
				<Group block aphroditeStyles={classes.wrapper}>
					<Section grow aphroditeStyles={classes.search}>
						<ListHeaderSearch
							handleChange={this.props.searchHandleChange}
							handleClear={this.props.searchHandleClear}
							handleKeyup={this.props.searchHandleKeyup}
							value={this.props.searchValue}
						/>
					</Section>
					<Section grow aphroditeStyles={classes.buttons}>
						<Group block>
							<Section aphroditeStyles={classes.filter}>
								<ListFiltersAdd
									dispatch={this.props.dispatch}
									activeFilters={this.props.filtersActive}
									availableFilters={this.props.filtersAvailable}
								/>
							</Section>
							<Section aphroditeStyles={classes.columns}>
								<ListColumnsForm
									availableColumns={this.props.columnsAvailable}
									activeColumns={this.props.columnsActive}
									dispatch={this.props.dispatch}
								/>
							</Section>
							<Section aphroditeStyles={classes.download}>
								<ListDownloadForm
									activeColumns={this.props.columnsActive}
									dispatch={this.props.dispatch}
									list={this.props.list}
								/>
							</Section>
							<Section aphroditeStyles={classes.expand}>
								<ButtonDivider>
									<GlyphButton
										active={this.props.expandIsActive}
										glyph="mirror"
										onClick={this.props.expandOnClick}
										title="Expand table width"
									/>
								</ButtonDivider>
							</Section>
							{this.props.createIsAvailable && <span id="listCreateHeaderButton">
								<Section aphroditeStyles={classes.create}>
									<ButtonDivider>
										<CreateButton
											listName={this.props.createListName}
											onClick={this.props.list.customCreateButton ? () => this.setState({
												popoutIsOpen: true,
											}) : this.props.createOnClick}
										/>
									</ButtonDivider>
								</Section>
							</span>}
						</Group>
					</Section>
				</Group>
				<Popout isOpen={this.state.popoutIsOpen} onCancel={this.closePopout} relativeToID="listCreateHeaderButton">
					<Popout.Header
						title={`Select ${this.props.createListName} Type`}
					/>
					<Popout.Body>
						{this.props.list.customButtonOptions && this.props.list.customButtonOptions.map(item => (
							<button
								type="button"
								title={item.label}
								className="PopoutList__item"
								key={item.key}
								onClick={() => this.handleCreateButtonOptions(item.key)}
							>
								<span className="PopoutList__item__icon octicon octicon-chevron-right"></span>
								<span className="PopoutList__item__label">{item.label}</span>
							</button>
						))}
					</Popout.Body>
				</Popout>
			</span >
		);
	},
});


const tabletGrowStyles = {
	[`@media (max-width: ${theme.breakpoint.tabletPortraitMax})`]: {
		flexGrow: 1,
	},
};

const classes = {
	// main wrapper
	wrapper: {
		[`@media (max-width: ${theme.breakpoint.tabletPortraitMax})`]: {
			flexWrap: 'wrap',
		},
	},

	// button wrapper
	buttons: {
		[`@media (max-width: ${theme.breakpoint.tabletPortraitMax})`]: {
			paddingLeft: 0,
		},
	},

	// cols
	expand: {
		[`@media (max-width: ${theme.breakpoint.desktopMax})`]: {
			display: 'none',
		},
	},
	filter: {
		[`@media (max-width: ${theme.breakpoint.tabletPortraitMax})`]: {
			paddingLeft: 0,
			flexGrow: 1,
		},
	},
	columns: tabletGrowStyles,
	create: tabletGrowStyles,
	download: tabletGrowStyles,
	search: {
		[`@media (max-width: ${theme.breakpoint.tabletPortraitMax})`]: {
			marginBottom: '0.75em',
			minWidth: '100%',
		},
	},
};

module.exports = ListHeaderToolbar;

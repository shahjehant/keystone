/**
 * The list view is a paginated table of all items in the list. It can show a
 * variety of information about the individual items in columns.
 */

import React from 'react';
// import { findDOMNode } from 'react-dom'; // TODO re-implement focus when ready
import numeral from 'numeral';
import { connect } from 'react-redux';

import {
	BlankState,
	Center,
	Container,
	Glyph,
	GlyphButton,
	Pagination,
	Spinner,
} from '../../elemental';

import ListFilters from './components/Filtering/ListFilters';
import ListHeaderTitle from './components/ListHeaderTitle';
import ListHeaderToolbar from './components/ListHeaderToolbar';
import ListManagement from './components/ListManagement';

import ConfirmationDialog from '../../shared/ConfirmationDialog';
import AlertMessages from '../../shared/AlertMessages';
import CreateForm from '../../shared/CreateForm';
import FlashMessages from '../../shared/FlashMessages';
import ItemsTable from './components/ItemsTable/ItemsTable';
import UpdateForm from './components/UpdateForm';
import { plural as pluralize } from '../../../utils/string';
import { listsByPath } from '../../../utils/lists';
import { checkForQueryChange } from '../../../utils/queryParams';
import IframeContent from '../../../App/shared/IframeContent';

import {
	deleteItems,
	setActiveSearch,
	setActiveSort,
	setCurrentPage,
	selectList,
	clearCachedQuery,
	customAction,
	customActionDownload,
} from './actions';

import {
	deleteItem,
} from '../Item/actions';

const ESC_KEY_CODE = 27;

const ListView = React.createClass({
	contextTypes: {
		router: React.PropTypes.object.isRequired,
	},
	getInitialState() {
		return {
			confirmationDialog: {
				isOpen: false,
			},
			checkedItems: {},
			constrainTableWidth: true,
			manageMode: false,
			showCreateForm: false,
			showUpdateForm: false,
			alerts: {},
			// Custom Action View
			showIframe: false,
			action_url: null,
			id: null,
			customUpdateValue: null,
		};
	},
	componentWillMount() {
		// When we directly navigate to a list without coming from another client
		// side routed page before, we need to initialize the list and parse
		// possibly specified query parameters

		this.props.dispatch(selectList(this.props.params.listId));

		const isNoCreate = this.props.lists.data[this.props.params.listId].nocreate;
		const shouldOpenCreate = this.props.location.search === '?create';

		this.setState({
			showCreateForm: (shouldOpenCreate && !isNoCreate) || Keystone.createFormErrors,
		});

	},
	componentWillReceiveProps(nextProps) {
		// Review and make it more generic to clear custom action view on link change
		if (this.props && this.props.lists.currentList && this.props.lists.currentList.id !== 'list_items') {
			this.setState({ showIframe: false, action_url: null, id: null, showCreateForm: false });
		}

		// We've opened a new list from the client side routing, so initialize
		// again with the new list id
		this.setState({
			alerts: {},
		});
		const isReady = this.props.lists.ready && nextProps.lists.ready;
		if (isReady && checkForQueryChange(nextProps, this.props)) {
			this.props.dispatch(selectList(nextProps.params.listId));
		}
	},
	componentWillUnmount() {
		this.setState({ showIframe: false, action_url: null, id: null }); // Custom Action View
		this.props.dispatch(clearCachedQuery());

	},

	// ==============================
	// HEADER
	// ==============================
	// Called when a new item is created
	onCreate(item) {
		// Hide the create form
		this.toggleCreateModal(false);
		// Redirect to newly created item path
		const list = this.props.currentList;
		this.context.router.push(`${Keystone.adminPath}/${list.path}/${item.id}`);
	},
	createAutocreate() {
		const list = this.props.currentList;
		list.createItem(null, (err, data) => {
			if (err) {
				// TODO Proper error handling
				alert('Something went wrong, please try again!');
				console.log(err);
			} else {
				this.context.router.push(`${Keystone.adminPath}/${list.path}/${data.id}`);
			}
		});
	},
	updateSearch(e) {
		this.props.dispatch(setActiveSearch(e.target.value));
	},
	handleSearchClear() {
		this.props.dispatch(setActiveSearch(''));

		// TODO re-implement focus when ready
		// findDOMNode(this.refs.listSearchInput).focus();
	},
	handleSearchKey(e) {
		// clear on esc
		if (e.which === ESC_KEY_CODE) {
			this.handleSearchClear();
		}
	},
	handlePageSelect(i) {
		// If the current page index is the same as the index we are intending to pass to redux, bail out.
		if (i === this.props.lists.page.index) return;
		return this.props.dispatch(setCurrentPage(i));
	},
	toggleManageMode(filter = !this.state.manageMode) {
		this.setState({
			manageMode: filter,
			checkedItems: {},
		});
	},
	toggleUpdateModal(filter = !this.state.showUpdateForm) {
		this.setState({
			showUpdateForm: filter,
		});
	},
	handlePromptInputChange(event) {
		this.setState({
			customUpdateValue: event.target.value,
		})
	},
	massUpdate() {
		// TODO: Implement update multi-item
		console.log('Update ALL the things!');
	},
	massDelete() {
		const { checkedItems } = this.state;
		const list = this.props.currentList;
		const itemCount = pluralize(checkedItems, ('* ' + list.singular.toLowerCase()), ('* ' + list.plural.toLowerCase()));
		const itemIds = Object.keys(checkedItems);

		let message = `Are you sure you want to delete ${itemCount}?`;

		if (list.deletePrompt) {
			message = list.deletePrompt;
		}

		this.setState({
			confirmationDialog: {
				isOpen: true,
				label: 'Delete',
				body: (
					<div>
						{message}
						<br />
						<br />
						This cannot be undone.
					</div>
				),
				onConfirmation: () => {
					this.props.dispatch(deleteItems(itemIds));
					this.toggleManageMode();
					this.removeConfirmationDialog();
				},
			},
		});
	},
	isMultipleAllowed(itemIds, multiple) {
		if (!multiple && itemIds.length > 1) {
			this.setState({
				alerts: {
					error: {
						error: 'Please select only one Record to complete this task.',
					},
				},
			});
			return false;
		}
		return true;
	},
	customAction(customActionData) {
		const { action, type, multiple, data, status } = customActionData;
		const { checkedItems } = this.state;
		const itemIds = Object.keys(checkedItems);
		if (type === 'download') {
			if (this.isMultipleAllowed(itemIds, multiple)) {
				this.props.dispatch(customActionDownload(itemIds, action));
				this.toggleManageMode();
				this.setState({
					alerts: {},
				});
			}
		} else if (type === 'view') { // Custom Action View

			if (this.isMultipleAllowed(itemIds, multiple)) {
				const iframeURL = `${Keystone.externalHost}/${action}/${itemIds}`;
				this.setState({
					showIframe: true,
					action_url: action,
					id: itemIds,
				});
				this.toggleManageMode();
				this.setState({
					alerts: {},
				});
			}
		} else if (type === 'prompt') {
			if (this.isMultipleAllowed(itemIds, multiple)) {
				this.setState({
					confirmationDialog: {
						isOpen: true,
						label: 'Save',
						body: (
							<div>
								<lable style={{ color: '#7F7F7F' }}>Enter a Value: </lable>
								<input style={{ padding: '0.75em', height: '2.0em', borderColor: '#ccc', borderWidth: 1, borderRadius: '0.3rem', borderStyle: 'solid' }} type="text" onChange={this.handlePromptInputChange} />
							</div>
						),
						onConfirmation: () => {
							this.props.dispatch(customAction(itemIds, action, this.state.customUpdateValue));
							this.toggleManageMode();
							this.removeConfirmationDialog();
						},
					},
				});
			}
		} else { // simple event trigger
			if (this.isMultipleAllowed(itemIds, multiple)) {
				this.props.dispatch(customAction(itemIds, action, status));
				this.toggleManageMode();
			}
		}
	},
	handleManagementSelect(selection) {
		if (selection === 'all') this.checkAllItems();
		if (selection === 'none') this.uncheckAllTableItems();
		if (selection === 'visible') this.checkAllTableItems();
		return false;
	},
	renderConfirmationDialog() {
		const props = this.state.confirmationDialog;
		return (
			<ConfirmationDialog
				confirmationLabel={props.label}
				isOpen={props.isOpen}
				onCancel={this.removeConfirmationDialog}
				onConfirmation={props.onConfirmation}
			>
				{props.body}
			</ConfirmationDialog>
		);
	},
	renderManagement() {
		const { checkedItems, manageMode, selectAllItemsLoading } = this.state;
		const { currentList } = this.props;

		return (
			<ListManagement
				checkedItemCount={Object.keys(checkedItems).length}
				handleDelete={this.massDelete}
				handleSelect={this.handleManagementSelect}
				handleToggle={() => this.toggleManageMode(!manageMode)}
				isOpen={manageMode}
				itemCount={this.props.items.count}
				itemsPerPage={this.props.lists.page.size}
				nodelete={currentList.nodelete}
				noedit={currentList.noedit}
				selectAllItemsLoading={selectAllItemsLoading}
				currentList={currentList}
				handleCustomAction={this.customAction}
				handleCustomActionDownload={this.customActionDownload}
			/>
		);
	},
	renderPagination() {
		const items = this.props.items;
		if (this.state.manageMode || !items.count) return;

		const list = this.props.currentList;
		const currentPage = this.props.lists.page.index;
		const pageSize = this.props.lists.page.size;

		return (
			<Pagination
				currentPage={currentPage}
				onPageSelect={this.handlePageSelect}
				pageSize={pageSize}
				plural={list.plural}
				singular={list.singular}
				style={{ marginBottom: 0 }}
				total={items.count}
				limit={10}
			/>
		);
	},
	renderHeader() {
		const items = this.props.items;
		const { autocreate, nocreate, plural, singular } = this.props.currentList;

		return (
			<Container style={{ paddingTop: '2em' }}>
				<ListHeaderTitle
					activeSort={this.props.active.sort}
					availableColumns={this.props.currentList.columns}
					handleSortSelect={this.handleSortSelect}
					title={`
						${numeral(items.count).format()}
						${pluralize(items.count, ' ' + singular, ' ' + plural)}
					`}
				/>
				<ListHeaderToolbar
					// common
					dispatch={this.props.dispatch}
					list={listsByPath[this.props.params.listId]}

					// expand
					expandIsActive={!this.state.constrainTableWidth}
					expandOnClick={this.toggleTableWidth}

					// create
					createIsAvailable={!nocreate}
					createListName={singular}
					createOnClick={autocreate
						? this.createAutocreate
						: this.openCreateModal}

					// search
					searchHandleChange={this.updateSearch}
					searchHandleClear={this.handleSearchClear}
					searchHandleKeyup={this.handleSearchKey}
					searchValue={this.props.active.search}

					// filters
					filtersActive={this.props.active.filters}
					filtersAvailable={this.props.currentList.columns.filter((col) => (
						col.field && col.field.hasFilterMethod) || col.type === 'heading'
					)}

					// columns
					columnsActive={this.props.active.columns}
					columnsAvailable={this.props.currentList.columns}

					// Custom Create Button
					customCreateButton={this.customCreateButton}
				/>
				<ListFilters
					dispatch={this.props.dispatch}
					filters={this.props.active.filters}
				/>
			</Container>
		);
	},

	// ==============================
	// TABLE
	// ==============================

	checkTableItem(item, e) {
		e.preventDefault();
		const newCheckedItems = { ...this.state.checkedItems };
		const itemId = item.id;
		if (this.state.checkedItems[itemId]) {
			delete newCheckedItems[itemId];
		} else {
			newCheckedItems[itemId] = true;
		}
		this.setState({
			checkedItems: newCheckedItems,
		});
	},
	checkAllTableItems() {
		const checkedItems = {};
		this.props.items.results.forEach(item => {
			checkedItems[item.id] = true;
		});
		this.setState({
			checkedItems: checkedItems,
		});
	},
	checkAllItems() {
		const checkedItems = { ...this.state.checkedItems };
		// Just in case this API call takes a long time, we'll update the select all button with
		// a spinner.
		this.setState({ selectAllItemsLoading: true });
		var self = this;
		this.props.currentList.loadItems({
			expandRelationshipFilters: false,
			filters: this.props.active.filters,
			// filters: {
			// 	fetch_all_data: true,
			// 	item_count: this.props.currentList && this.props.currentList.items && this.props.currentList.items.count,
			// },
		}, function (err, data) {
			data.results.forEach(item => {
				checkedItems[item.id] = true;
			});
			self.setState({
				checkedItems: checkedItems,
				selectAllItemsLoading: false,
			});
		});
	},
	uncheckAllTableItems() {
		this.setState({
			checkedItems: {},
		});
	},
	deleteTableItem(item, e) {
		if (e.altKey) {
			this.props.dispatch(deleteItem(item.id));
			return;
		}

		e.preventDefault();

		const list = this.props.currentList;

		let message = `Are you sure you want to delete <strong>${item.name}</strong>?`;



		if (list.deletePrompt) {
			message = list.deletePrompt;
		}

		this.setState({
			confirmationDialog: {
				isOpen: true,
				label: 'Delete',
				body: (
					<div>
						<span dangerouslySetInnerHTML={{ __html: message }} />
						<br />
						<br />
						This cannot be undone.
					</div>
				),
				onConfirmation: () => {
					this.props.dispatch(deleteItem(item.id));
					this.removeConfirmationDialog();
				},
			},
		});
	},
	removeConfirmationDialog() {
		this.setState({
			confirmationDialog: {
				isOpen: false,
			},
		});
	},
	toggleTableWidth() {
		this.setState({
			constrainTableWidth: !this.state.constrainTableWidth,
		});
	},

	// ==============================
	// COMMON
	// ==============================

	handleSortSelect(path, inverted) {
		if (inverted) path = '-' + path;
		this.props.dispatch(setActiveSort(path));
	},
	toggleCreateModal(visible) {
		this.setState({
			showCreateForm: visible,
			showIframe: visible, // Custom Action View
		});
	},
	openCreateModal() {
		this.toggleCreateModal(true);
	},
	closeCreateModal() {
		this.toggleCreateModal(false);
	},
	showBlankState() {
		return !this.props.loading
			&& !this.props.items.results.length
			&& !this.props.active.search
			&& !this.props.active.filters.length;
	},
	renderBlankState() {
		const { currentList } = this.props;

		if (!this.showBlankState()) return null;

		// create and nav directly to the item view, or open the create modal
		const onClick = currentList.autocreate
			? this.createAutocreate
			: this.openCreateModal;

		// display the button if create allowed
		const button = !currentList.nocreate ? (
			<GlyphButton color="success" glyph="plus" position="left" onClick={onClick} data-e2e-list-create-button="no-results">
				Create {currentList.singular}
			</GlyphButton>
		) : null;

		return (
			<Container>
				{(this.props.error) ? (
					<FlashMessages
						messages={{
							error: [{
								title: "There is a problem with the network, we're trying to reconnect...",
							}],
						}}
					/>
				) : null}
				<BlankState heading={`No ${this.props.currentList.plural.toLowerCase()} found...`} style={{ marginTop: 40 }}>
					{button}
				</BlankState>
			</Container>
		);
	},
	renderActiveState() {
		if (this.showBlankState()) return null;

		const containerStyle = {
			transition: 'max-width 160ms ease-out',
			msTransition: 'max-width 160ms ease-out',
			MozTransition: 'max-width 160ms ease-out',
			WebkitTransition: 'max-width 160ms ease-out',
		};
		if (!this.state.constrainTableWidth) {
			containerStyle.maxWidth = '100%';
		}
		return (
			<div>
				{this.renderHeader()}
				<Container>
					<div style={{ height: 35, marginBottom: '1em', marginTop: '1em' }}>
						{this.renderManagement()}
						{this.renderPagination()}
						<span style={{ clear: 'both', display: 'table' }} />
					</div>
				</Container>
				<Container style={containerStyle}>
					{(this.props.error) ? (
						<FlashMessages
							messages={{
								error: [{
									title: "There is a problem with the network, we're trying to reconnect..",
								}],
							}}
						/>
					) : null}
					{(this.props.loading) ? (
						<Center height="50vh">
							<Spinner />
						</Center>
					) : (
							<div>
								<ItemsTable
									activeSort={this.props.active.sort}
									checkedItems={this.state.checkedItems}
									checkTableItem={this.checkTableItem}
									columns={this.props.active.columns}
									deleteTableItem={this.deleteTableItem}
									handleSortSelect={this.handleSortSelect}
									items={this.props.items}
									list={this.props.currentList}
									manageMode={this.state.manageMode}
									rowAlert={this.props.rowAlert}
									currentPage={this.props.lists.page.index}
									pageSize={this.props.lists.page.size}
									drag={this.props.lists.drag}
									dispatch={this.props.dispatch}
								/>
								{this.renderNoSearchResults()}
							</div>
						)}
				</Container>
			</div>
		);
	},
	renderNoSearchResults() {
		if (this.props.items.results.length) return null;
		let matching = this.props.active.search;
		if (this.props.active.filters.length) {
			matching += (matching ? ' and ' : '') + pluralize(this.props.active.filters.length, '* filter', '* filters');
		}
		matching = matching ? ' found matching ' + matching : '.';
		return (
			<BlankState style={{ marginTop: 20, marginBottom: 20 }}>
				<Glyph
					name="search"
					size="medium"
					style={{ marginBottom: 20 }}
				/>
				<h2 style={{ color: 'inherit' }}>
					No {this.props.currentList.plural.toLowerCase()}{matching}
				</h2>
			</BlankState>
		);
	},
	customCreateButton(action_type) {
		let action = this.props.lists.currentList && this.props.lists.currentList.link && this.props.lists.currentList.link.create;
		action = (action.length && action[0] === '/') ? action.slice(1) : action;
		this.setState({
			showIframe: true,
			action_url: action,
			id: action_type,
		});
	},
	renderIframeView() { // Custom Action View
		const { action_url, id } = this.state;
		const iframeURL = `${Keystone.externalHost}/${action_url}/${id}`;
		return <IframeContent src={iframeURL} show={this.state.showIframe} onCancel={this.closeCreateModal} onSave={this.onCreate} className={"full-screen"} />;
	},
	render() {
		if (!this.props.ready) {
			return (
				<Center height="50vh" data-screen-id="list">
					<Spinner />
				</Center>
			);
		}
		return (
			<div data-screen-id="list">
				{this.renderIframeView()}
				{(this.state.alerts) ? <AlertMessages alerts={this.state.alerts} /> : null}
				{this.renderBlankState()}
				{this.renderActiveState()}
				<CreateForm
					err={Keystone.createFormErrors}
					isOpen={this.state.showCreateForm}
					list={this.props.currentList}
					onCancel={this.closeCreateModal}
					onCreate={this.onCreate}
				/>
				<UpdateForm
					isOpen={this.state.showUpdateForm}
					itemIds={Object.keys(this.state.checkedItems)}
					list={this.props.currentList}
					onCancel={() => this.toggleUpdateModal(false)}
				/>
				{this.renderConfirmationDialog()}
			</div>
		);
	},
});

module.exports = connect((state) => {
	return {
		lists: state.lists,
		loading: state.lists.loading,
		error: state.lists.error,
		currentList: state.lists.currentList,
		items: state.lists.items,
		page: state.lists.page,
		ready: state.lists.ready,
		rowAlert: state.lists.rowAlert,
		active: state.active,
	};
})(ListView);

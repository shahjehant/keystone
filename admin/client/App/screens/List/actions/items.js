import {
	LOAD_ITEMS,
	ITEMS_LOADED,
	ITEM_LOADING_ERROR,
} from '../constants';
const xhr = require('xhr');
const assign = require('object-assign');
import { NETWORK_ERROR_RETRY_DELAY } from '../../../../constants';
export function loadItems(options = {}) {
	return (dispatch, getState) => {
		let currentLoadCounter = getState().lists.loadCounter + 1;

		dispatch({
			type: LOAD_ITEMS,
			loadCounter: currentLoadCounter,
		});

		// Take a snapshot of the current redux state.
		const state = getState();
		// Hold a reference to the currentList in state.
		const currentList = state.lists.currentList;

		currentList.loadItems({
			search: state.active.search,
			filters: state.active.filters,
			sort: state.active.sort,
			columns: state.active.columns,
			page: state.lists.page,
		}, (err, items) => {

			// Create a new state snapshot and compare the current active list id
			// to the id of the currentList referenced above.
			// If they are the same, then this is the latest fetch request, we may resolve this normally.
			// If these are not the same, then it means that this is not the latest fetch request.
			// BAIL OUT!

			if (getState().active.id !== currentList.id) return;
			if (getState().lists.loadCounter > currentLoadCounter) return;
			if (items) {

				// if (page.index !== drag.page && drag.item) {
				// 	// add the dragging item
				// 	if (page.index > drag.page) {
				// 		_items.results.unshift(drag.item);
				// 	} else {
				// 		_items.results.push(drag.item);
				// 	}
				// }
				// _itemsResultsClone = items.results.slice(0);
				//

				// TODO Reenable this
				// if (options.success && options.id) {
				// 	// flashes a success background on the row
				// 	_rowAlert.success = options.id;
				// }
				// if (options.fail && options.id) {
				// 	// flashes a failure background on the row
				// 	_rowAlert.fail = options.id;
				// }

				// Successfully resolve this request in redux and set the loadCounter back to zero.
				dispatch(itemsLoaded(items));
			} else {
				// Catch this error in redux and set the loadCounter back to zero.
				dispatch(itemLoadingError(err));
			}
		});
	};
}

export function downloadItems(format, columns) {
	return (dispatch, getState) => {
		const state = getState();
		const active = state.active;
		const currentList = state.lists.currentList;
		const url = currentList.getDownloadURL({
			search: active.search,
			filters: active.filters,
			sort: active.sort,
			columns: columns ? currentList.expandColumns(columns) : active.columns,
			format: format,
		});
		window.open(url);
	};
}

export function itemsLoaded(items) {
	return {
		type: ITEMS_LOADED,
		items,
	};
}

/**
 * Dispatched when unsuccessfully trying to load the items, will redispatch
 * loadItems after NETWORK_ERROR_RETRY_DELAY milliseconds until we get items back
 */

export function itemLoadingError() {
	return (dispatch) => {
		dispatch({
			type: ITEM_LOADING_ERROR,
			err: 'Network request failed',
		});
		setTimeout(() => {
			dispatch(loadItems());
		}, NETWORK_ERROR_RETRY_DELAY);
	};
}

export function deleteItems(ids) {
	return (dispatch, getState) => {
		const list = getState().lists.currentList;
		list.deleteItems(ids, (err, data) => {
			// TODO ERROR HANDLING
			dispatch(loadItems());
		});
	};
}

export function customAction(ids, action, customUpdateValue) {
	return (dispatch, getState) => {

		let formData = new FormData();
		formData.append('ids', ids);
		formData.append('customUpdateValue', customUpdateValue);

		xhr({
			url: `/app/${action}`,
			responseType: 'json',
			method: 'PUT',
			headers: assign({}, Keystone.csrf.header),
			body: formData,
		}, (err, resp, data) => {
			if (err) return callback(err);

			if (resp.statusCode === 200) {
				dispatch(loadItems());
			} else {
				callback(data);
			}
		});
	};
}

export function customActionDownload(id, action) {
	return (dispatch, getState) => {
		const url = '/app/' + action;
		
		var xhr = new XMLHttpRequest();
		xhr.open('POST', url, true);
		xhr.responseType = 'arraybuffer';
		xhr.onload = function () {
			if (this.status !== 200) {
				return;
			}
			try {
				var filename = "";
				var disposition = xhr.getResponseHeader('Content-Disposition');
				if (disposition && disposition.indexOf('attachment') !== -1) {
						var filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
						var matches = filenameRegex.exec(disposition);
						if (matches != null && matches[1]) filename = matches[1].replace(/['"]/g, '');
				}
				var type = xhr.getResponseHeader('Content-Type');

				var blob = typeof File === 'function'
						? new File([this.response], filename, { type: type })
						: new Blob([this.response], { type: type });
				if (typeof window.navigator.msSaveBlob !== 'undefined') {
						// IE workaround for "HTML7007: One or more blob URLs were revoked by closing the blob for which they were created. These URLs will no longer resolve as the data backing the URL has been freed."
						window.navigator.msSaveBlob(blob, filename);
				} else {
						var URL = window.URL || window.webkitURL;
						var downloadUrl = URL.createObjectURL(blob);

						if (filename) {
								// use HTML5 a[download] attribute to specify filename
								var a = document.createElement("a");
								// safari doesn't support this yet
								if (typeof a.download === 'undefined') {
										window.location = downloadUrl;
								} else {
										a.href = downloadUrl;
										a.download = filename;
										document.body.appendChild(a);
										a.click();
								}
						} else {
							window.location = downloadUrl;
						}
						setTimeout(function () { URL.revokeObjectURL(downloadUrl); }, 100); // cleanup
				}
			} catch (err) {
				console.error(err);
			}
		};
		xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
		xhr.send(jquery.param({id}));
	};
}
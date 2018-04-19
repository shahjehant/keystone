var _ = require('lodash');

/**
 * Gets the options for the List, as used by the React components
 */
function getOptions (req) {
	var ops = {
		autocreate: this.options.autocreate,
		autokey: this.autokey,
		defaultColumns: this.options.defaultColumns,
		defaultSort: this.options.defaultSort,
		fields: {},
		hidden: _.isFunction(this.options.hidden) ? this.options.hidden(req) : this.options.hidden,
		initialFields: _.map(this.initialFields, 'path'),
		key: this.key,
		label: this.label,
		nameField: this.nameField ? this.nameField.getOptions(req) : null,
		nameFieldIsFormHeader: this.nameFieldIsFormHeader,
		nameIsInitial: this.nameIsInitial,
		nameIsVirtual: this.nameIsVirtual,
		namePath: this.namePath,
		nocreate: _.isFunction(this.options.nocreate) ? this.options.nocreate(req) : this.options.nocreate,
		nodelete: _.isFunction(this.options.nodelete) ? this.options.nodelete(req) : this.options.nodelete,
		noedit: _.isFunction(this.options.noedit) ? this.options.noedit(req) : this.options.noedit,
		path: this.path,
		perPage: this.options.perPage,
		plural: this.plural,
		searchFields: this.options.searchFields,
		singular: this.singular,
		sortable: this.options.sortable,
		scrollable: this.options.scrollable,
		sortContext: this.options.sortContext,
		track: this.options.track,
		tracking: this.tracking,
		relationships: this.relationships,
		uiElements: [],
		link: {
			list: (this.options.link && this.options.link.list) || null,
			create: (this.options.link && this.options.link.create) || null,
			edit: (this.options.link && this.options.link.edit) || null,
		},
		deletePrompt: this.options.deletePrompt,
		customAction: this.options.customAction,
	};
	_.forEach(this.uiElements, function (el) {
		switch (el.type) {
			// TODO: handle indentation
			case 'field':
				// add the field options by path
				ops.fields[el.field.path] = el.field.getOptions(req);
				// don't output hidden fields
				if (ops.fields[el.field.path].hidden) {
					return;
				}
				// add the field to the elements array
				ops.uiElements.push({
					type: 'field',
					field: el.field.path,
				});
				break;
			case 'heading':
				ops.uiElements.push({
					type: 'heading',
					content: el.heading,
					options: el.options,
				});
				break;
		}
	});
	return ops;
}

module.exports = getOptions;

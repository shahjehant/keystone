/**
 * Constants
 */

// breakpoints
exports.breakpoint = {
	xs: 480,
	sm: 768,
	md: 992,
	lg: 1200,
};

// border radii
exports.borderRadius = {
	xs: 2,
	sm: 4,
	md: 8,
	lg: 16,
	xl: 32,
};

// color
exports.color = {
	appDanger: '#d64242',
	appInfo: '#56cdfc',
	appPrimary: '#1385e5',
	appSuccess: '#34c240',
	appWarning: '#fa9f47',
};

// spacing
exports.spacing = {
	xs: 5,
	sm: 10,
	md: 20,
	lg: 40,
	xl: 80,
};

// table constants

exports.TABLE_CONTROL_COLUMN_WIDTH = 26;  // icon + padding
exports.NETWORK_ERROR_RETRY_DELAY = 500; // in ms

// routes
export const rolePermissions = {
	'User Management': ['users', 'sessions'],
	'Order Management': [
		'sale_ledgers',
		'sale_ledger_items',
		'sale_order_batches',
		'sale_order_fee_batches',
		'dispatch_order_batches',
		'transfer_outs',
		'adjust_outs',
		'credit_note_outs',
		'shipping_labels',
		'previous_orders'],
	'Stock Management': [
		'stock_in_ledgers',
		'stock_out_ledgers',],
	'Purchase Management': ['purchase_orders',
		'purchase_credit_notes',
		'purchase_replacemnet_ins',
		'purchase_return_ins',
		'adjust_ins',
		'transfer_ins',],
	'Message Administrator': [
		'messages',
		'return_messages',
		'case_messages',
		'resolved_messages',
		'waiting_messages',
		'message_templates'],
	// Add more roles and their corresponding routes as needed
  };
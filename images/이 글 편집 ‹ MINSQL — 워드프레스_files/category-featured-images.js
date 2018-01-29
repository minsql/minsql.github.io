/**
 * Plugin Name: Category Featured Images
 * Author: Mattia Roccoberton
 * Author URI: http://blocknot.es
 * License: GPL3
 */

jQuery(document).ready( function() {
	var cfi_media_upload;

	jQuery('#cfi-change-image').click(function(e) {
		e.preventDefault();

	// If the uploader object has already been created, reopen the dialog
		if( cfi_media_upload ) {
			cfi_media_upload.open();
			return;
		}

	// Extend the wp.media object
		cfi_media_upload = wp.media.frames.file_frame = wp.media({
			title: 'Choose an image',
			button: { text: 'Choose image' },
			multiple: false
		});
 
	//When a file is selected, grab the URL and set it as the text field's value
		cfi_media_upload.on( 'select', function() {
			attachment = cfi_media_upload.state().get( 'selection' ).first().toJSON();
			jQuery('#cfi-featured-image').val( attachment.id );
			jQuery('#cfi-thumbnail').empty();
			jQuery('#cfi-thumbnail').append( '<img src="' + attachment.url + '" class="attachment-thumbnail cfi-preview" />' );
		});

	//Open the uploader dialog
		cfi_media_upload.open();
	});

	jQuery('#cfi-remove-image').click(function(e) {
		jQuery('#cfi-featured-image').val('');
		jQuery('#cfi-thumbnail').empty();
	});
});

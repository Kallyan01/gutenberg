/**
 * WordPress dependencies
 */
import { store as blocksStore } from '@wordpress/blocks';
import { useSelect } from '@wordpress/data';
import { SearchControl, Button } from '@wordpress/components';
import { __, _n, sprintf } from '@wordpress/i18n';
import { useEffect, useState, useRef } from '@wordpress/element';
import { useDebounce } from '@wordpress/compose';
import { speak } from '@wordpress/a11y';

/**
 * Internal dependencies
 */
import BlockManagerCategory from './category';

/**
 * Provides a list of blocks with checkboxes.
 *
 * @param {Object}   props                    Props.
 * @param {Array}    props.blockTypes         An array of blocks.
 * @param {Array}    props.selectedBlockTypes An array of selected blocks.
 * @param {Function} props.onChange           Function to be called when the selected blocks change.
 */
export default function BlockManager( {
	blockTypes,
	selectedBlockTypes,
	onChange,
} ) {
	const debouncedSpeak = useDebounce( speak, 500 );
	const [ search, setSearch ] = useState( '' );
	const { categories, isMatchingSearchTerm } = useSelect( ( select ) => {
		return {
			categories: select( blocksStore ).getCategories(),
			isMatchingSearchTerm: select( blocksStore ).isMatchingSearchTerm,
		};
	}, [] );
	const blockManagerCategoryRef = useRef( null );

	useEffect( () => {
		const container = document.querySelector(
			'.components-modal__content'
		);
		const stickyElement = blockManagerCategoryRef.current;

		if ( ! container || ! stickyElement ) {
			return;
		}

		const handleFocusIn = ( event ) => {
			const focusedElement = event.target;

			// Check if the focused element is within the container
			if ( container.contains( focusedElement ) ) {
				const stickyBottom = 250;
				const focusedRect = focusedElement.getBoundingClientRect();

				// Calculate the desired scroll position
				if (
					focusedRect.top < stickyBottom &&
					container.scrollTop > 190
				) {
					const offset =
						container.scrollTop - stickyElement.offsetHeight;
					container.scrollTo( {
						top: offset,
						behavior: 'smooth',
					} );
				}
			}
		};

		container.addEventListener( 'focusin', handleFocusIn );

		// Cleanup the event listener
		return () => {
			container.removeEventListener( 'focusin', handleFocusIn );
		};
	}, [] );

	function enableAllBlockTypes() {
		onChange( blockTypes );
	}

	const filteredBlockTypes = blockTypes.filter( ( blockType ) => {
		return ! search || isMatchingSearchTerm( blockType, search );
	} );

	const numberOfHiddenBlocks = blockTypes.length - selectedBlockTypes.length;

	// Announce search results on change
	useEffect( () => {
		if ( ! search ) {
			return;
		}
		const count = filteredBlockTypes.length;
		const resultsFoundMessage = sprintf(
			/* translators: %d: number of results. */
			_n( '%d result found.', '%d results found.', count ),
			count
		);
		debouncedSpeak( resultsFoundMessage );
	}, [ filteredBlockTypes?.length, search, debouncedSpeak ] );

	return (
		<div className="block-editor-block-manager__content">
			{ !! numberOfHiddenBlocks && (
				<div className="block-editor-block-manager__disabled-blocks-count">
					{ sprintf(
						/* translators: %d: number of blocks. */
						_n(
							'%d block is hidden.',
							'%d blocks are hidden.',
							numberOfHiddenBlocks
						),
						numberOfHiddenBlocks
					) }
					<Button
						__next40pxDefaultSize
						variant="link"
						onClick={ enableAllBlockTypes }
					>
						{ __( 'Reset' ) }
					</Button>
				</div>
			) }
			<SearchControl
				__nextHasNoMarginBottom
				label={ __( 'Search for a block' ) }
				placeholder={ __( 'Search for a block' ) }
				value={ search }
				onChange={ ( nextSearch ) => setSearch( nextSearch ) }
				className="block-editor-block-manager__search"
			/>
			<div
				tabIndex="0"
				role="region"
				aria-label={ __( 'Available block types' ) }
				className="block-editor-block-manager__results"
			>
				{ filteredBlockTypes.length === 0 && (
					<p className="block-editor-block-manager__no-results">
						{ __( 'No blocks found.' ) }
					</p>
				) }
				{ categories.map( ( category ) => (
					<BlockManagerCategory
						ref={ blockManagerCategoryRef }
						key={ category.slug }
						title={ category.title }
						blockTypes={ filteredBlockTypes.filter(
							( blockType ) =>
								blockType.category === category.slug
						) }
						selectedBlockTypes={ selectedBlockTypes }
						onChange={ onChange }
					/>
				) ) }
				<BlockManagerCategory
					ref={ blockManagerCategoryRef }
					title={ __( 'Uncategorized' ) }
					blockTypes={ filteredBlockTypes.filter(
						( { category } ) => ! category
					) }
					selectedBlockTypes={ selectedBlockTypes }
					onChange={ onChange }
				/>
			</div>
		</div>
	);
}

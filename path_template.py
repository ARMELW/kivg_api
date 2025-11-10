#!/usr/bin/env python3
"""
SVG Path Template Extractor

This script extracts path data from SVG files and creates a JSON template
that can be used with the whiteboard animation system.

Usage:
    python path_template.py create <svg_file> <output_json> <width> <height>
"""

import json
import sys
import re
import xml.etree.ElementTree as ET
from pathlib import Path
from typing import Dict, List, Any, Tuple


def extract_svg_paths(svg_file: str) -> Tuple[List[str], Dict[str, Any]]:
    """
    Extract path data and metadata from an SVG file.
    
    Args:
        svg_file: Path to the SVG file
        
    Returns:
        A tuple of (paths, metadata) where paths is a list of path 'd' attributes
        and metadata contains viewBox, width, height info
    """
    try:
        tree = ET.parse(svg_file)
        root = tree.getroot()
        
        # Handle namespace
        namespace = {'svg': 'http://www.w3.org/2000/svg'}
        if '}' in root.tag:
            namespace['svg'] = root.tag.split('}')[0].strip('{')
        
        # Extract viewBox
        viewbox = root.get('viewBox', '')
        
        # Extract width and height
        width = root.get('width', '')
        height = root.get('height', '')
        
        # Try to parse numeric values from width/height
        try:
            width_num = float(re.sub(r'[^0-9.]', '', width)) if width else None
        except (ValueError, AttributeError):
            width_num = None
            
        try:
            height_num = float(re.sub(r'[^0-9.]', '', height)) if height else None
        except (ValueError, AttributeError):
            height_num = None
        
        # If no explicit width/height, try to get from viewBox
        if viewbox and (not width_num or not height_num):
            viewbox_parts = viewbox.split()
            if len(viewbox_parts) == 4:
                try:
                    if not width_num:
                        width_num = float(viewbox_parts[2])
                    if not height_num:
                        height_num = float(viewbox_parts[3])
                except (ValueError, IndexError):
                    pass
        
        # Extract all path elements
        paths = []
        
        # Try with namespace
        for path in root.findall('.//svg:path', namespace):
            d_attr = path.get('d')
            if d_attr:
                paths.append(d_attr)
        
        # If no paths found with namespace, try without
        if not paths:
            for path in root.findall('.//path'):
                d_attr = path.get('d')
                if d_attr:
                    paths.append(d_attr)
        
        metadata = {
            'viewBox': viewbox if viewbox else None,
            'width': width_num,
            'height': height_num,
            'original_width': width,
            'original_height': height
        }
        
        return paths, metadata
        
    except ET.ParseError as e:
        print(f"Error parsing SVG file: {e}", file=sys.stderr)
        sys.exit(1)
    except FileNotFoundError:
        print(f"SVG file not found: {svg_file}", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"Unexpected error: {e}", file=sys.stderr)
        sys.exit(1)


def create_template(svg_file: str, output_json: str, width: int, height: int):
    """
    Create a JSON template from an SVG file.
    
    Args:
        svg_file: Path to the input SVG file
        output_json: Path to the output JSON file
        width: Target width for the shape
        height: Target height for the shape
    """
    # Extract paths and metadata
    paths, metadata = extract_svg_paths(svg_file)
    
    if not paths:
        print("Warning: No paths found in SVG file", file=sys.stderr)
    
    # Create template structure
    template = {
        'version': '1.0',
        'source_svg': str(Path(svg_file).name),
        'target_dimensions': {
            'width': width,
            'height': height
        },
        'svg_metadata': {
            'viewBox': metadata['viewBox'],
            'original_width': metadata['original_width'],
            'original_height': metadata['original_height'],
            'computed_width': metadata['width'],
            'computed_height': metadata['height']
        },
        'paths': paths,
        'path_count': len(paths),
        'primary_path': paths[0] if paths else None,
        'whiteboard_config': {
            'type': 'shape',
            'svg_path': str(Path(svg_file).absolute()),
            'width': width,
            'height': height,
            'mode': 'draw',
            'svg_sampling_rate': 12,
            'svg_reverse': False
        }
    }
    
    # Ensure output directory exists
    output_path = Path(output_json)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    # Write JSON template
    try:
        with open(output_json, 'w', encoding='utf-8') as f:
            json.dump(template, f, indent=2, ensure_ascii=False)
        print(f"Template created successfully: {output_json}")
        print(f"Extracted {len(paths)} path(s) from SVG")
        return 0
    except Exception as e:
        print(f"Error writing template file: {e}", file=sys.stderr)
        return 1


def main():
    """Main entry point."""
    if len(sys.argv) < 2:
        print("Usage: python path_template.py create <svg_file> <output_json> <width> <height>")
        sys.exit(1)
    
    command = sys.argv[1]
    
    if command == 'create':
        if len(sys.argv) != 6:
            print("Usage: python path_template.py create <svg_file> <output_json> <width> <height>")
            sys.exit(1)
        
        svg_file = sys.argv[2]
        output_json = sys.argv[3]
        
        try:
            width = int(sys.argv[4])
            height = int(sys.argv[5])
        except ValueError:
            print("Error: width and height must be integers", file=sys.stderr)
            sys.exit(1)
        
        sys.exit(create_template(svg_file, output_json, width, height))
    else:
        print(f"Unknown command: {command}", file=sys.stderr)
        print("Available commands: create")
        sys.exit(1)


if __name__ == '__main__':
    main()

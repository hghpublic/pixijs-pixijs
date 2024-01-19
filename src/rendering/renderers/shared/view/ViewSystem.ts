import { DOMAdapter } from '../../../../environment/adapter';
import { ExtensionType } from '../../../../extensions/Extensions';
import { Rectangle } from '../../../../maths/shapes/Rectangle';
import { deprecation, v8_0_0 } from '../../../../utils/logging/deprecation';
import { getCanvasTexture } from '../texture/utils/getCanvasTexture';

import type { ICanvas } from '../../../../environment/canvas/ICanvas';
import type { TypeOrBool } from '../../../../scene/container/destroyTypes';
import type { System } from '../system/System';
import type { CanvasSource, CanvasSourceOptions } from '../texture/sources/CanvasSource';
import type { Texture } from '../texture/Texture';

/** Options passed to the ViewSystem */
export interface ViewSystemOptions
{
    /** The width of the screen. */
    width?: number;
    /** The height of the screen. */
    height?: number;
    /** The canvas to use as a view, optional. */
    canvas?: ICanvas;
    /** @deprecated */
    view?: ICanvas;
    /** Resizes renderer view in CSS pixels to allow for resolutions other than 1. */
    autoDensity?: boolean;
    /** The resolution / device pixel ratio of the renderer. */
    resolution?: number;
    /** **WebGL Only.** Whether to enable anti-aliasing. This may affect performance. */
    antialias?: boolean;
    /** TODO: multiView */
    multiView?: boolean;

    backgroundAlpha?: number;
}

export interface ViewSystemDestroyOptions
{
    /** Whether to remove the view element from the DOM. Defaults to `false`. */
    removeView?: boolean;
}

/**
 * The view system manages the main canvas that is attached to the DOM.
 * This main role is to deal with how the holding the view reference and dealing with how it is resized.
 * @memberof rendering
 */
export class ViewSystem implements System<ViewSystemOptions, TypeOrBool<ViewSystemDestroyOptions>>
{
    /** @ignore */
    public static extension = {
        type: [
            ExtensionType.WebGLSystem,
            ExtensionType.WebGPUSystem,
            ExtensionType.CanvasSystem,
        ],
        name: 'view',
        priority: 0,
    } as const;

    /** @ignore */
    public static defaultOptions: ViewSystemOptions = {
        /**
         * {@link WebGLOptions.width}
         * @default 800
         */
        width: 800,
        /**
         * {@link WebGLOptions.height}
         * @default 600
         */
        height: 600,
        /**
         * {@link WebGLOptions.autoDensity}
         * @default false
         */
        autoDensity: false,
        /**
         * {@link WebGLOptions.antialias}
         * @default false
         */
        antialias: false,
    };

    public multiView: boolean;

    /** The canvas element that everything is drawn to. */
    public canvas: ICanvas;

    public texture: Texture;

    /**
     * Whether CSS dimensions of canvas view should be resized to screen dimensions automatically.
     * @member {boolean}
     */
    public autoDensity: boolean;

    public antialias: boolean;

    public screen: Rectangle;

    get resolution(): number
    {
        return this.texture.source._resolution;
    }

    set resolution(value: number)
    {
        this.texture.source.resize(
            this.texture.source.width,
            this.texture.source.height,
            value
        );
    }

    /**
     * initiates the view system
     * @param options - the options for the view
     */
    public init(options: ViewSystemOptions): void
    {
        options = {
            ...ViewSystem.defaultOptions,
            ...options,
        };

        if (options.view)
        {
            deprecation(v8_0_0, 'ViewSystem.view has been renamed to ViewSystem.canvas');
            options.canvas = options.view;
        }

        this.screen = new Rectangle(0, 0, options.width, options.height);
        this.canvas = options.canvas || DOMAdapter.get().createCanvas();
        this.antialias = !!options.antialias;
        this.texture = getCanvasTexture(this.canvas, options as CanvasSourceOptions);
        (this.texture.source as CanvasSource).transparent = options.backgroundAlpha < 1;
        this.multiView = !!options.multiView;

        if (this.autoDensity)
        {
            this.canvas.style.width = `${this.texture.width}px`;
            this.canvas.style.height = `${this.texture.height}px`;
        }

        this.resolution = options.resolution;
    }

    /**
     * Resizes the screen and canvas to the specified dimensions.
     * @param desiredScreenWidth - The new width of the screen.
     * @param desiredScreenHeight - The new height of the screen.
     * @param resolution
     */
    public resize(desiredScreenWidth: number, desiredScreenHeight: number, resolution: number): void
    {
        this.texture.source.resize(desiredScreenWidth, desiredScreenHeight, resolution);

        this.screen.width = this.texture.frame.width;
        this.screen.height = this.texture.frame.height;

        if (this.autoDensity)
        {
            this.canvas.style.width = `${desiredScreenWidth}px`;
            this.canvas.style.height = `${desiredScreenHeight}px`;
        }
    }

    /**
     * Destroys this System and optionally removes the canvas from the dom.
     * @param {options | false} options - The options for destroying the view, or "false".
     * @param options.removeView - Whether to remove the view element from the DOM. Defaults to `false`.
     */
    public destroy(options: TypeOrBool<ViewSystemDestroyOptions> = false): void
    {
        const removeView = typeof options === 'boolean' ? options : !!options?.removeView;

        if (removeView && this.canvas.parentNode)
        {
            this.canvas.parentNode.removeChild(this.canvas);
        }

        // note: don't nullify the element
        //       other systems may need to unbind from it during the destroy iteration (eg. GLContextSystem)
    }
}
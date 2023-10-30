import { deprecation, v8_0_0 } from '../../../utils/logging/deprecation';

import type { Container } from '../Container';

export interface FindMixinConstructor
{
    label?: string;
}
export interface FindMixin extends Required<FindMixinConstructor>
{
    /**
     * @deprecated since 8.0.0
     * @see Container#label
     */
    name: string;
    getChildByName(label: RegExp | string, deep?: boolean): Container | null;
    getChildByLabel(label: RegExp | string, deep?: boolean): Container | null;
    getChildrenByLabel(label: RegExp | string, deep?: boolean, out?: Container[]): Container[];
}

export const findMixin: Partial<Container> = {
    label: null,

    /** @deprecated since 8.0.0 */
    get name(): string
    {
        deprecation(v8_0_0, 'Container.name property has been removed, use Container.label instead');

        return this.label;
    },
    /** @deprecated since 8.0.0 */
    set name(value: string)
    {
        deprecation(v8_0_0, 'Container.name property has been removed, use Container.label instead');

        this.label = value;
    },

    /**
     * @method getChildByName
     * @memberof Container#
     * @deprecated since 8.0.0
     * @see Container#getChildByLabel
     * @param {string} name - Instance name.
     * @param {boolean}[deep=false] - Whether to search recursively
     * @returns {Container} The child with the specified name.
     */
    getChildByName(name: string, deep = false): Container | null
    {
        return this.getChildByLabel(name, deep);
    },
    /**
     * Returns the first child in the container with the specified label.
     *
     * Recursive searches are done in a pre-order traversal.
     * @method getChildByLabel
     * @memberof Container#
     * @param {string|RegExp} label - Instance label.
     * @param {boolean}[deep=false] - Whether to search recursively
     * @returns {Container} The child with the specified label.
     */
    getChildByLabel(label: string | RegExp, deep = false): Container | null
    {
        const children = this.children;

        for (let i = 0; i < children.length; i++)
        {
            const child = children[i];

            if (child.label === label || (label instanceof RegExp && label.test(child.label))) return child;
        }

        if (deep)
        {
            for (let i = 0; i < children.length; i++)
            {
                const child = children[i];
                const found = child.getChildByLabel(label, true);

                if (found)
                {
                    return found;
                }
            }
        }

        return null;
    },

    /**
     * Returns all children in the container with the specified label.
     * @method getChildrenByLabel
     * @memberof Container#
     * @param {string|RegExp} label - Instance label.
     * @param {boolean}[deep=false] - Whether to search recursively
     * @param {Container[]} [out=[]] - The array to store matching children in.
     * @returns {Container[]} An array of children with the specified label.
     */
    getChildrenByLabel(label: string | RegExp, deep = false, out = []): Container[]
    {
        const children = this.children;

        for (let i = 0; i < children.length; i++)
        {
            const child = children[i];

            if (child.label === label || (label instanceof RegExp && label.test(child.label)))
            {
                out.push(child);
            }
        }

        if (deep)
        {
            for (let i = 0; i < children.length; i++)
            {
                children[i].getChildrenByLabel(label, true, out);
            }
        }

        return out;
    },
} as Container;
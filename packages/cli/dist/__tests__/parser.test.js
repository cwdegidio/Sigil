import { describe, it, expect } from 'vitest';
import { parse } from '../parser.js';
// ─── Fixture helpers ──────────────────────────────────────────────────────────
const MINIMAL_SIGIL = `\
sigil Checkout:
    identity:
        version: 1.0
        status: draft
    provision PlaceOrder behavior:
        trigger:
            - User submits the checkout form
        postconditions:
            - Order is created
`;
const MINIMAL_CHARTER = `\
charter OrderManagement:
    identity:
        version: 1.0
        status: draft
    sigils:
        - Checkout
`;
const MINIMAL_DOCTRINE = `\
doctrine ECommerce:
    identity:
        version: 1.0
        status: draft
    charters:
        - OrderManagement
`;
// ─── Tests ────────────────────────────────────────────────────────────────────
describe('parser', () => {
    describe('sigil', () => {
        it('parses a minimal valid sigil', () => {
            const { ast, errors } = parse(MINIMAL_SIGIL, 'test.sigil');
            expect(errors).toHaveLength(0);
            expect(ast).not.toBeNull();
            expect(ast?.kind).toBe('sigil');
            const sigil = ast;
            expect(sigil.name).toBe('Checkout');
            expect(sigil.identity.version).toBe('1.0');
            expect(sigil.identity.status).toBe('draft');
            expect(sigil.provisions).toHaveLength(1);
        });
        it('parses a behavior provision with trigger, preconditions, and postconditions', () => {
            const src = `\
sigil Checkout:
    identity:
        version: 1.0
        status: draft
    provision PlaceOrder behavior:
        trigger:
            - User submits the checkout form
        preconditions:
            - Cart is not empty
        postconditions:
            - Order is created
`;
            const { ast, errors } = parse(src, 'test.sigil');
            expect(errors).toHaveLength(0);
            const sigil = ast;
            const prov = sigil.provisions[0];
            expect(prov.name).toBe('PlaceOrder');
            expect(prov.body.kind).toBe('behavior');
            if (prov.body.kind === 'behavior') {
                expect(prov.body.trigger.kind).toBe('single');
                expect(prov.body.preconditions?.items).toHaveLength(1);
                expect(prov.body.postconditions.items).toHaveLength(1);
            }
        });
        it('parses a rule provision', () => {
            const src = `\
sigil Checkout:
    identity:
        version: 1.0
        status: draft
    provision OrderTotalMatchesItems rule:
        preconditions:
            - Order exists
        postconditions:
            - Order.total equals sum of Item.price for each Item in Order
`;
            const { ast, errors } = parse(src, 'test.sigil');
            expect(errors).toHaveLength(0);
            const sigil = ast;
            expect(sigil.provisions[0].body.kind).toBe('rule');
        });
        it('parses trigger and: with multiple items', () => {
            const src = `\
sigil Checkout:
    identity:
        version: 1.0
        status: draft
    provision PlaceOrder behavior:
        trigger and:
            - User is authenticated
            - Cart is not empty
        postconditions:
            - Order is created
`;
            const { ast, errors } = parse(src, 'test.sigil');
            expect(errors).toHaveLength(0);
            const sigil = ast;
            const prov = sigil.provisions[0];
            if (prov.body.kind === 'behavior') {
                expect(prov.body.trigger.kind).toBe('and');
                expect(prov.body.trigger.items).toHaveLength(2);
            }
        });
        it('parses vocabulary section', () => {
            const src = `\
sigil Checkout:
    identity:
        version: 1.0
        status: draft
    vocabulary:
        Cart:
            definition: "A collection of items."
    provision PlaceOrder behavior:
        trigger:
            - User submits form
        postconditions:
            - Order is created
`;
            const { ast, errors } = parse(src, 'test.sigil');
            expect(errors).toHaveLength(0);
            const sigil = ast;
            expect(sigil.vocabulary?.entries).toHaveLength(1);
            expect(sigil.vocabulary?.entries[0].name).toBe('Cart');
        });
        it('parses scope section', () => {
            const src = `\
sigil Checkout:
    identity:
        version: 1.0
        status: draft
    scope:
        excludes:
            - Payment processing
    provision PlaceOrder behavior:
        trigger:
            - User submits form
        postconditions:
            - Order is created
`;
            const { ast, errors } = parse(src, 'test.sigil');
            expect(errors).toHaveLength(0);
            const sigil = ast;
            expect(sigil.scope?.excludes).toHaveLength(1);
        });
        it('parses sigil-level invariants', () => {
            const src = `\
sigil Checkout:
    identity:
        version: 1.0
        status: draft
    provision PlaceOrder behavior:
        trigger:
            - User submits form
        postconditions:
            - Order is created
    invariants:
        - Order total is always positive
`;
            const { ast, errors } = parse(src, 'test.sigil');
            expect(errors).toHaveLength(0);
            const sigil = ast;
            expect(sigil.invariants?.items).toHaveLength(1);
        });
    });
    describe('parse errors — sigil', () => {
        it('errors when identity section is missing', () => {
            const src = `\
sigil Checkout:
    provision PlaceOrder behavior:
        trigger:
            - User submits form
        postconditions:
            - Order is created
`;
            const { errors } = parse(src, 'test.sigil');
            expect(errors.length).toBeGreaterThan(0);
            expect(errors.some(e => e.message.match(/identity/i))).toBe(true);
        });
        it('errors when no provision is declared', () => {
            const src = `\
sigil Checkout:
    identity:
        version: 1.0
        status: draft
`;
            const { errors } = parse(src, 'test.sigil');
            expect(errors.length).toBeGreaterThan(0);
            expect(errors.some(e => e.message.match(/provision/i))).toBe(true);
        });
        it('errors on trigger: with multiple items', () => {
            const src = `\
sigil Checkout:
    identity:
        version: 1.0
        status: draft
    provision PlaceOrder behavior:
        trigger:
            - First condition
            - Second condition
        postconditions:
            - Order is created
`;
            const { errors } = parse(src, 'test.sigil');
            expect(errors.some(e => e.message.match(/trigger.*one item|trigger and|trigger or/i))).toBe(true);
        });
        it('errors on trigger and: with only one item', () => {
            const src = `\
sigil Checkout:
    identity:
        version: 1.0
        status: draft
    provision PlaceOrder behavior:
        trigger and:
            - Only one condition
        postconditions:
            - Order is created
`;
            const { errors } = parse(src, 'test.sigil');
            expect(errors.some(e => e.message.match(/trigger and.*two|at least two/i))).toBe(true);
        });
        it('errors on empty vocabulary block', () => {
            // vocabulary: with no entries — this requires the block to be present but empty
            // Since we can't easily express an empty block in valid indentation syntax,
            // we test that when the vocabulary keyword appears, at least one entry is required.
            const src = `\
sigil Checkout:
    identity:
        version: 1.0
        status: draft
    vocabulary:
    provision PlaceOrder behavior:
        trigger:
            - User submits form
        postconditions:
            - Order is created
`;
            // vocabulary: followed immediately by provision (no block) — parse error
            const { errors } = parse(src, 'test.sigil');
            expect(errors.length).toBeGreaterThan(0);
        });
        it('errors on sections out of order (scope before vocabulary)', () => {
            const src = `\
sigil Checkout:
    identity:
        version: 1.0
        status: draft
    scope:
        excludes:
            - Payment processing
    vocabulary:
        Cart:
            definition: "A collection."
    provision PlaceOrder behavior:
        trigger:
            - User submits form
        postconditions:
            - Order is created
`;
            const { errors } = parse(src, 'test.sigil');
            expect(errors.some(e => e.message.match(/order|vocabulary|scope/i))).toBe(true);
        });
        it('errors on a second top-level declaration', () => {
            const src = `\
sigil Checkout:
    identity:
        version: 1.0
        status: draft
    provision PlaceOrder behavior:
        trigger:
            - User submits form
        postconditions:
            - Order is created
sigil AnotherSigil:
    identity:
        version: 1.0
        status: draft
    provision Foo behavior:
        trigger:
            - Something
        postconditions:
            - Something else
`;
            const { errors } = parse(src, 'test.sigil');
            expect(errors.some(e => e.message.match(/exactly one declaration/i))).toBe(true);
        });
    });
    describe('charter', () => {
        it('parses a minimal valid charter', () => {
            const { ast, errors } = parse(MINIMAL_CHARTER, 'test.charter');
            expect(errors).toHaveLength(0);
            expect(ast?.kind).toBe('charter');
            const charter = ast;
            expect(charter.name).toBe('OrderManagement');
            expect(charter.sigils).toHaveLength(1);
            expect(charter.sigils[0].name).toBe('Checkout');
        });
        it('parses version-pinned member references', () => {
            const src = `\
charter OrderManagement:
    identity:
        version: 1.0
        status: draft
    sigils:
        - Checkout@1.2
`;
            const { ast, errors } = parse(src, 'test.charter');
            expect(errors).toHaveLength(0);
            const charter = ast;
            expect(charter.sigils[0].version).toBe('1.2');
        });
        it('errors when sigils section is missing', () => {
            const src = `\
charter OrderManagement:
    identity:
        version: 1.0
        status: draft
`;
            const { errors } = parse(src, 'test.charter');
            expect(errors.some(e => e.message.match(/sigils/i))).toBe(true);
        });
    });
    describe('doctrine', () => {
        it('parses a minimal valid doctrine', () => {
            const { ast, errors } = parse(MINIMAL_DOCTRINE, 'test.doctrine');
            expect(errors).toHaveLength(0);
            expect(ast?.kind).toBe('doctrine');
            const doctrine = ast;
            expect(doctrine.name).toBe('ECommerce');
            expect(doctrine.charters).toHaveLength(1);
        });
        it('errors when charters section is missing', () => {
            const src = `\
doctrine ECommerce:
    identity:
        version: 1.0
        status: draft
`;
            const { errors } = parse(src, 'test.doctrine');
            expect(errors.some(e => e.message.match(/charters/i))).toBe(true);
        });
    });
    describe('parse errors — identity section', () => {
        it('errors when version is missing', () => {
            const src = `\
sigil Checkout:
    identity:
        status: draft
    provision PlaceOrder behavior:
        trigger:
            - User submits form
        postconditions:
            - Order is created
`;
            const { errors } = parse(src, 'test.sigil');
            expect(errors.some(e => e.message.match(/version/i))).toBe(true);
        });
        it('errors when status is missing', () => {
            const src = `\
sigil Checkout:
    identity:
        version: 1.0
    provision PlaceOrder behavior:
        trigger:
            - User submits form
        postconditions:
            - Order is created
`;
            const { errors } = parse(src, 'test.sigil');
            expect(errors.some(e => e.message.match(/status/i))).toBe(true);
        });
    });
    describe('behavior vs rule field ordering', () => {
        it('errors when postconditions is missing from a behavior provision', () => {
            const src = `\
sigil Checkout:
    identity:
        version: 1.0
        status: draft
    provision PlaceOrder behavior:
        trigger:
            - User submits form
`;
            const { errors } = parse(src, 'test.sigil');
            expect(errors.some(e => e.message.match(/postconditions/i))).toBe(true);
        });
        it('errors when preconditions is missing from a rule provision', () => {
            const src = `\
sigil Checkout:
    identity:
        version: 1.0
        status: draft
    provision OrderValid rule:
        postconditions:
            - Order total is correct
`;
            const { errors } = parse(src, 'test.sigil');
            expect(errors.some(e => e.message.match(/preconditions/i))).toBe(true);
        });
    });
});
//# sourceMappingURL=parser.test.js.map
import {expect,it} from 'vitest';
import {discountFor,totalFor} from '../../apps/api/src/modules/orders/money.js';
it('floors percentages in integer VND and applies maximum/minimum boundaries',()=>{expect(discountFor(999n,{kind:'PERCENT',value:'15',minSubtotal:'999',maxDiscount:null})).toBe(149n);expect(discountFor(1000n,{kind:'PERCENT',value:'15',minSubtotal:'0',maxDiscount:'100'})).toBe(100n);expect(()=>discountFor(998n,{kind:'FIXED',value:'100',minSubtotal:'999'})).toThrow();});
it('caps fixed discount at subtotal while retaining shipping',()=>{const discount=discountFor(100n,{kind:'FIXED',value:'1000',minSubtotal:'0'});expect(discount).toBe(100n);expect(totalFor(100n,discount,50000n)).toBe(50000n);});
it('rejects overflow and negative totals without number precision loss',()=>{expect(totalFor(999999999999999999n,0n,0n)).toBe(999999999999999999n);expect(()=>totalFor(999999999999999999n,0n,1n)).toThrow();expect(()=>totalFor(10n,11n,0n)).toThrow();});

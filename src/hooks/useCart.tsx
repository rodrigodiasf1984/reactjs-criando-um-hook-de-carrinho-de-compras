import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}
interface UpdateProductAmount {
  productId: number;
  amount: number;
}
interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');
    if (storagedCart) {
      return JSON.parse(storagedCart);
    }
    return [];
  });

  const addProduct = async (productId: number) => {    
    try {
      const productExistInCart = cart.find(p=>p.id === productId);
      const stock = await api.get<Stock>(`/stock/${productId}`);
      const stockAmount =  stock.data.amount;
      const currentAmount= productExistInCart ? productExistInCart.amount : 0;
      const amount = currentAmount +1 ;
      
      if(amount > stockAmount){
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }
      if(!productExistInCart){
        const {data:product} = await api.get<Product>(`products/${productId}`);
       setCart([...cart, {...product, amount}]); 
       localStorage.setItem('@RocketShoes:cart', JSON.stringify([...cart, {...product, amount: 1}]));
        
      }else{
        const updatedCart = cart.map(p=> (
          p.id === productId ? {...p, amount: p.amount+1 } : p
          )); 
          console.log(updatedCart, 'CART')
          setCart(updatedCart);
          localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart))
      }
    } catch(error) {
      toast.error(error)
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const productExistInCart = cart.find(p=>p.id === productId);     
      if(!productExistInCart) {
        toast.error('Produto não se encontra no carrinho')
        return;
      }
      const updatedCart = cart.filter(p => p.id !== productId);
      setCart(updatedCart);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart));
    } catch {
      toast.error('Erro ao remover o produto');    
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if(amount <= 0 ){
        return;
      }
      const {data:stock} = await api.get<Stock>(`/stock/${productId}`);
      const stockAmount = stock.amount;
      if(amount > stockAmount){
        toast.error('Quantidade solicitada fora de estoque!'); 
        return;
      }
      const updatedCart = cart.map(p=> (
        p.id === productId ? {...p, amount: amount } : p
        )); 
      setCart(updatedCart);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart))
    } catch {
      toast.error('Erro ao alterar a quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);
  return context;
}

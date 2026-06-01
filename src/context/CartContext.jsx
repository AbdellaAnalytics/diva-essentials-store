import { createContext, useContext, useReducer, useState } from 'react'

const CartCtx = createContext(null)
export const useCart = () => useContext(CartCtx)

function reducer(state, action) {
  switch (action.type) {
    case 'ADD': {
      const existing = state.find(i => i.id === action.product.id)
      if (existing) {
        return state.map(i =>
          i.id === action.product.id ? { ...i, qty: i.qty + action.qty } : i
        )
      }
      return [...state, { ...action.product, qty: action.qty }]
    }
    case 'SET_QTY':
      return state
        .map(i => (i.id === action.id ? { ...i, qty: action.qty } : i))
        .filter(i => i.qty > 0)
    case 'REMOVE':
      return state.filter(i => i.id !== action.id)
    case 'CLEAR':
      return []
    default:
      return state
  }
}

export function CartProvider({ children }) {
  const [items, dispatch] = useReducer(reducer, [])
  const [open, setOpen] = useState(false)

  const add = (product, qty = 1) => {
    dispatch({ type: 'ADD', product, qty })
    setOpen(true)
  }
  const setQty = (id, qty) => dispatch({ type: 'SET_QTY', id, qty })
  const remove = (id) => dispatch({ type: 'REMOVE', id })
  const clear = () => dispatch({ type: 'CLEAR' })

  const count = items.reduce((n, i) => n + i.qty, 0)
  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0)

  return (
    <CartCtx.Provider value={{ items, add, setQty, remove, clear, count, subtotal, open, setOpen }}>
      {children}
    </CartCtx.Provider>
  )
}

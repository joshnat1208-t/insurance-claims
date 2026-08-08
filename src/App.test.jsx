import React from 'react'
import { render, screen } from '@testing-library/react'
import { fireEvent } from '@testing-library/react'
import App from './App'

describe('App role defaults', () => {
  it('defaults reviewers to the In Review status filter', () => {
    render(<App />)

    const [roleSelect, statusSelect] = screen.getAllByRole('combobox')

    fireEvent.change(roleSelect, { target: { value: 'reviewer' } })
    expect(statusSelect).toHaveValue('In Review')

    fireEvent.change(roleSelect, { target: { value: 'admin' } })
    expect(statusSelect).toHaveValue('All')
  })
})
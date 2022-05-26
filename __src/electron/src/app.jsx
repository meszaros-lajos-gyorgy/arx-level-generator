import path from 'path'
import React from 'react'
import ReactDOM from 'react-dom'
import { setRootPath } from '../../../rootpath'
import App from './components/App'
import './style.scss'

setRootPath(path.resolve(__dirname, '../../../'))

window.addEventListener('DOMContentLoaded', () => {
  ReactDOM.render(<App />, document.getElementById('app'))
})

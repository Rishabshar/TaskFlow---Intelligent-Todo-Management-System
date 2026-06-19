import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDarkMode } from '../../context/DarkModeContext';

export default function Todo() {
  const navigate = useNavigate();
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const [todos, setTodos] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [filter, setFilter] = useState('all');
  const [user, setUser] = useState(null);

  // Load todos and user on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    loadTodos();
  }, []);

  // Load todos from localStorage
  const loadTodos = () => {
    const storedTodos = localStorage.getItem('todos');
    if (storedTodos) {
      setTodos(JSON.parse(storedTodos));
    }
  };

  // Save todos to localStorage
  const saveTodos = (updatedTodos) => {
    localStorage.setItem('todos', JSON.stringify(updatedTodos));
  };

  // Add new todo
  const addTodo = () => {
    if (!inputValue.trim()) {
      return;
    }

    const newTodo = {
      id: Date.now(),
      text: inputValue,
      completed: false,
      createdAt: new Date()
    };

    const updatedTodos = [newTodo, ...todos]; // Add to top
    setTodos(updatedTodos);
    saveTodos(updatedTodos);
    setInputValue('');
  };

  // Toggle todo completion
  const toggleTodo = (id) => {
    const updatedTodos = todos.map(todo =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    );
    setTodos(updatedTodos);
    saveTodos(updatedTodos);
  };

  // Delete todo
  const deleteTodo = (id) => {
    const updatedTodos = todos.filter(todo => todo.id !== id);
    setTodos(updatedTodos);
    saveTodos(updatedTodos);
  };

  // Handle enter key
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      addTodo();
    }
  };

  // Filter todos
  const getFilteredTodos = () => {
    switch (filter) {
      case 'completed':
        return todos.filter(todo => todo.completed);
      case 'pending':
        return todos.filter(todo => !todo.completed);
      default:
        return todos;
    }
  };

  // Get statistics
  const totalTodos = todos.length;
  const completedTodos = todos.filter(todo => todo.completed).length;
  const pendingTodos = totalTodos - completedTodos;

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('todos');
    navigate('/signin');
  };

  const filteredTodos = getFilteredTodos();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white transition-colors duration-300">
      <div className="max-w-4xl mx-auto px-4 py-12">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4">
          <div>
            <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-600 mb-2">
              My Tasks
            </h1>
            <p className="text-slate-500 dark:text-slate-400">
              Welcome back, <span className="font-semibold text-indigo-500">{user?.username || 'User'}</span>!
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={toggleDarkMode} 
              className="p-2 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-yellow-400 hover:bg-slate-300 dark:hover:bg-slate-700 transition"
              title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDarkMode ? '☀️' : '🌙'}
            </button>
            <button 
              onClick={handleLogout} 
              className="px-4 py-2 text-sm font-medium text-red-600 bg-red-100 dark:bg-red-500/10 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-500/20 transition"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-1">{totalTodos}</div>
            <div className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Tasks</div>
          </div>
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="text-3xl font-bold text-green-600 dark:text-green-500 mb-1">{completedTodos}</div>
            <div className="text-sm font-medium text-slate-500 dark:text-slate-400">Completed</div>
          </div>
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="text-3xl font-bold text-orange-600 dark:text-orange-500 mb-1">{pendingTodos}</div>
            <div className="text-sm font-medium text-slate-500 dark:text-slate-400">Pending</div>
          </div>
        </div>

        {/* Input Section */}
        <div className="mb-8">
          <div className="relative flex shadow-md rounded-xl overflow-hidden bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus-within:ring-2 focus-within:ring-indigo-500 transition-all">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Add a new task..."
              className="flex-grow px-6 py-4 bg-transparent outline-none text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
            />
            <button 
              onClick={addTodo} 
              className="px-8 bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition-colors"
            >
              Add
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex bg-slate-200 dark:bg-slate-800 p-1 rounded-lg inline-flex mb-6 text-sm font-medium">
          {['all', 'pending', 'completed'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-md capitalize transition-all duration-200 ${
                filter === f 
                  ? 'bg-white dark:bg-slate-600 text-indigo-600 dark:text-indigo-400 shadow-sm' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Todo List */}
        <div className="space-y-3">
          {filteredTodos.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4 opacity-50">
                {filter === 'all' ? '📝' : filter === 'pending' ? '🎉' : '📂'}
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-lg">
                {filter === 'all' && 'No tasks yet. Add one above!'}
                {filter === 'pending' && 'No pending tasks. Great job!'}
                {filter === 'completed' && 'No completed tasks yet.'}
              </p>
            </div>
          ) : (
            filteredTodos.map(todo => (
              <div 
                key={todo.id} 
                className={`group flex items-center justify-between p-4 bg-white dark:bg-slate-800 rounded-xl border transition-all duration-200 ${
                  todo.completed 
                    ? 'border-slate-100 dark:border-slate-700 opacity-75' 
                    : 'border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700 shadow-sm hover:shadow-md'
                }`}
              >
                <div className="flex items-center gap-4 flex-grow">
                  <button
                    onClick={() => toggleTodo(todo.id)}
                    className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                      todo.completed
                        ? 'bg-green-500 border-green-500 text-white'
                        : 'border-slate-300 dark:border-slate-500 hover:border-indigo-500 dark:hover:border-indigo-400'
                    }`}
                  >
                    {todo.completed && <span className="text-xs">✓</span>}
                  </button>
                  
                  <div className="flex-grow">
                    <p className={`text-lg transition-all ${
                      todo.completed 
                        ? 'text-slate-400 dark:text-slate-500 line-through decoration-slate-400' 
                        : 'text-slate-800 dark:text-slate-200'
                    }`}>
                      {todo.text}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      {new Date(todo.createdAt).toLocaleDateString(undefined, {
                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => deleteTodo(todo.id)}
                  className="p-2 text-slate-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                  title="Delete task"
                >
                  🗑️
                </button>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
}
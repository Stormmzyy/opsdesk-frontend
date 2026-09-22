function SearchBox({ value, onChange }) {
  return (
    <div className="filter-field">
      <label htmlFor="employee-search">Search by name</label>
      <input
        id="employee-search"
        type="search"
        placeholder="e.g. Amara"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  )
}

export default SearchBox

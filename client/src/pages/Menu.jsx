import { useEffect, useMemo, useState } from 'react';
import { categoriesApi, menuItemsApi } from '../api/resources';
import { apiError, formatMAD } from '../utils';
import Modal from '../components/Modal';
import {
  Card,
  DangerButton,
  EmptyState,
  ErrorAlert,
  Field,
  GhostButton,
  NumberInput,
  PageHeader,
  PrimaryButton,
  SelectInput,
  Spinner,
  TextArea,
  TextInput,
  Toggle,
} from '../components/Form';

export default function Menu() {
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const [showCatForm, setShowCatForm] = useState(false);
  const [editingCat, setEditingCat] = useState(null);
  const [showItemForm, setShowItemForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deleting, setDeleting] = useState(null); // {type:'cat'|'item', obj}
  const [filterCat, setFilterCat] = useState('all');
  const [search, setSearch] = useState('');

  const fetchAll = async () => {
    setLoading(true);
    setError('');
    try {
      const [cats, its] = await Promise.all([categoriesApi.list(), menuItemsApi.list()]);
      setCategories(cats);
      setItems(its);
    } catch (err) {
      setError(apiError(err, 'Could not load the menu.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const catName = (id) => categories.find((c) => c.id === id)?.name || 'Uncategorized';

  const visibleItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((m) => {
      if (filterCat !== 'all' && String(m.category_id) !== String(filterCat)) return false;
      if (q && !`${m.name} ${m.description || ''}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [items, filterCat, search]);

  const toggleAvailable = async (item) => {
    setBusy(true);
    try {
      const saved = await menuItemsApi.update(item.id, { available: !item.available });
      setItems((is) => is.map((i) => (i.id === item.id ? saved : i)));
    } catch (err) {
      setError(apiError(err, 'Could not update availability.'));
    } finally {
      setBusy(false);
    }
  };

  const doDelete = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      if (deleting.type === 'cat') {
        await categoriesApi.remove(deleting.obj.id);
        setCategories((cs) => cs.filter((c) => c.id !== deleting.obj.id));
      } else {
        await menuItemsApi.remove(deleting.obj.id);
        setItems((is) => is.filter((i) => i.id !== deleting.obj.id));
      }
      setDeleting(null);
    } catch (err) {
      setError(apiError(err, 'Could not delete.'));
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <Spinner label="Loading menu…" />;

  return (
    <div>
      <PageHeader
        title="Menu management"
        subtitle="Categories and dishes — toggle availability to hide items from the POS."
        actions={
          <>
            <GhostButton onClick={() => { setEditingCat(null); setShowCatForm(true); }}>
              + Category
            </GhostButton>
            <PrimaryButton
              onClick={() => { setEditingItem(null); setShowItemForm(true); }}
              disabled={categories.length === 0}
            >
              + Menu item
            </PrimaryButton>
          </>
        }
      />
      <ErrorAlert message={error} />

      {/* Categories */}
      <Card className="p-5">
        <h2 className="mb-3 font-display text-lg font-semibold text-stone-50">Categories</h2>
        {categories.length === 0 ? (
          <EmptyState
            title="No categories yet"
            hint="Create a category (Starters, Mains, Desserts…) before adding items."
            action={<PrimaryButton onClick={() => { setEditingCat(null); setShowCatForm(true); }}>+ Add category</PrimaryButton>}
          />
        ) : (
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <div
                key={c.id}
                className="group flex items-center gap-1 rounded-xl border border-ember-600 bg-ember-850 py-1.5 pl-3.5 pr-1.5"
              >
                <span className="text-sm font-semibold text-stone-200">{c.name}</span>
                <button
                  onClick={() => { setEditingCat(c); setShowCatForm(true); }}
                  className="rounded-md px-1.5 py-0.5 text-xs text-stone-500 opacity-0 transition group-hover:opacity-100 hover:text-gold-300"
                  title="Rename"
                >
                  ✎
                </button>
                <button
                  onClick={() => setDeleting({ type: 'cat', obj: c })}
                  className="rounded-md px-1.5 py-0.5 text-xs text-stone-500 opacity-0 transition group-hover:opacity-100 hover:text-red-300"
                  title="Delete"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Items */}
      <div className="mt-6">
        <div className="mb-4 flex flex-wrap gap-3">
          <div className="min-w-44 flex-1">
            <TextInput
              placeholder="Search dishes…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <SelectInput
            value={filterCat}
            onChange={(e) => setFilterCat(e.target.value)}
            className="w-48"
          >
            <option value="all">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </SelectInput>
        </div>

        {visibleItems.length === 0 ? (
          <EmptyState
            title="No menu items"
            hint={items.length ? 'Try a different search or category filter.' : 'Add your first dish to start selling.'}
            action={
              categories.length > 0 && (
                <PrimaryButton onClick={() => { setEditingItem(null); setShowItemForm(true); }}>
                  + Add menu item
                </PrimaryButton>
              )
            }
          />
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {visibleItems.map((m) => (
              <Card key={m.id} className={`p-4 transition ${m.available === false ? 'opacity-60' : ''}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-stone-50">{m.name}</p>
                    <p className="text-xs font-medium text-gold-500">{catName(m.category_id)}</p>
                  </div>
                  <p className="shrink-0 font-display text-lg font-semibold text-gold-300">
                    {formatMAD(m.price)}
                  </p>
                </div>
                {m.description && (
                  <p className="mt-1.5 line-clamp-2 text-xs text-stone-400">{m.description}</p>
                )}
                <div className="mt-3 flex items-center justify-between border-t border-ember-700 pt-3">
                  <Toggle
                    checked={m.available !== false}
                    onChange={() => toggleAvailable(m)}
                    label={m.available !== false ? 'Available' : 'Hidden'}
                  />
                  <div className="flex gap-1">
                    <button
                      onClick={() => { setEditingItem(m); setShowItemForm(true); }}
                      className="rounded-lg px-2 py-1 text-xs font-semibold text-stone-400 hover:bg-ember-700 hover:text-stone-100"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setDeleting({ type: 'item', obj: m })}
                      className="rounded-lg px-2 py-1 text-xs font-semibold text-stone-500 hover:bg-red-500/10 hover:text-red-300"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {showCatForm && (
        <CategoryForm
          initial={editingCat}
          onClose={() => { setShowCatForm(false); setEditingCat(null); }}
          onSaved={(saved) => {
            setCategories((cs) =>
              editingCat ? cs.map((c) => (c.id === saved.id ? saved : c)) : [...cs, saved],
            );
            setShowCatForm(false);
            setEditingCat(null);
          }}
        />
      )}

      {showItemForm && (
        <ItemForm
          initial={editingItem}
          categories={categories}
          onClose={() => { setShowItemForm(false); setEditingItem(null); }}
          onSaved={(saved) => {
            setItems((is) =>
              editingItem ? is.map((i) => (i.id === saved.id ? saved : i)) : [...is, saved],
            );
            setShowItemForm(false);
            setEditingItem(null);
          }}
        />
      )}

      {deleting && (
        <Modal
          title={deleting.type === 'cat' ? 'Delete category' : 'Delete menu item'}
          onClose={() => setDeleting(null)}
        >
          <p className="text-sm text-stone-300">
            Delete <span className="font-bold text-stone-100">“{deleting.obj.name}”</span>? This
            cannot be undone.
            {deleting.type === 'cat' && ' Items in this category will become uncategorized.'}
          </p>
          <div className="mt-5 flex gap-2">
            <DangerButton className="flex-1" disabled={busy} onClick={doDelete}>
              Delete
            </DangerButton>
            <GhostButton onClick={() => setDeleting(null)}>Keep</GhostButton>
          </div>
        </Modal>
      )}
    </div>
  );
}

function CategoryForm({ initial, onClose, onSaved }) {
  const [name, setName] = useState(initial?.name ?? '');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const saved = initial
        ? await categoriesApi.update(initial.id, { name })
        : await categoriesApi.create({ name });
      onSaved(saved);
    } catch (err) {
      setError(apiError(err, 'Could not save category.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title={initial ? 'Rename category' : 'New category'} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <ErrorAlert message={error} />
        <Field label="Name">
          <TextInput
            required
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Starters"
          />
        </Field>
        <div className="flex gap-2">
          <PrimaryButton type="submit" className="flex-1" disabled={busy}>
            {busy ? 'Saving…' : initial ? 'Save' : 'Create'}
          </PrimaryButton>
          <GhostButton type="button" onClick={onClose}>
            Cancel
          </GhostButton>
        </div>
      </form>
    </Modal>
  );
}

function ItemForm({ initial, categories, onClose, onSaved }) {
  const [name, setName] = useState(initial?.name ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [price, setPrice] = useState(initial?.price ?? '');
  const [categoryId, setCategoryId] = useState(initial?.category_id ?? categories[0]?.id ?? '');
  const [available, setAvailable] = useState(initial?.available ?? true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const payload = {
        name,
        description: description || null,
        price: Number(price),
        category_id: Number(categoryId),
        available,
      };
      const saved = initial
        ? await menuItemsApi.update(initial.id, payload)
        : await menuItemsApi.create(payload);
      onSaved(saved);
    } catch (err) {
      setError(apiError(err, 'Could not save menu item.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title={initial ? `Edit “${initial.name}”` : 'New menu item'} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <ErrorAlert message={error} />
        <Field label="Name">
          <TextInput required value={name} onChange={(e) => setName(e.target.value)} placeholder="Tagine Kefta" />
        </Field>
        <Field label="Description">
          <TextArea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Slow-cooked kefta with tomato and cumin…" />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Price (MAD)">
            <NumberInput required min={0} step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} />
          </Field>
          <Field label="Category">
            <SelectInput value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </SelectInput>
          </Field>
        </div>
        <Toggle checked={available} onChange={setAvailable} label="Available for sale" />
        <div className="flex gap-2">
          <PrimaryButton type="submit" className="flex-1" disabled={busy}>
            {busy ? 'Saving…' : initial ? 'Save changes' : 'Add item'}
          </PrimaryButton>
          <GhostButton type="button" onClick={onClose}>
            Cancel
          </GhostButton>
        </div>
      </form>
    </Modal>
  );
}

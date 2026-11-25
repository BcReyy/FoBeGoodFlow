import React from 'react';
import Modal from './Modal.jsx';
import Field from './Field.jsx';

export default function Dialogs({
  modal,
  onClose,
  editingProduct,
  setEditingProduct,
  onSaveProduct,
  formError,
  accountForm,
  setAccountForm,
  onAddAccount,
  savingAccount = false,
  profileForm,
  setProfileForm,
  onSaveProfile,
  onRestockProduct,
  restockQuantity,
  setRestockQuantity,
  savingProduct = false,
  savingProfile = false,
}) {
  return (
    <>
      {modal?.type === 'product' && (
        <Modal title={modal.id != null ? 'Edit menu item' : 'Add menu item'} onClose={onClose}>
          <form onSubmit={onSaveProduct} className="dialog-form">
            <Field id="product-name" label="Item name">
              <input
                id="product-name"
                value={editingProduct.name}
                onChange={(e) => setEditingProduct((p) => ({ ...p, name: e.target.value }))}
                required maxLength={100} disabled={savingProduct}
              />
            </Field>
            <Field id="product-category" label="Category">
              <input
                id="product-category"
                value={editingProduct.category}
                onChange={(e) => setEditingProduct((p) => ({ ...p, category: e.target.value }))}
                required maxLength={50} disabled={savingProduct}
              />
            </Field>
            <Field id="product-description" label="Description">
              <textarea
                id="product-description" rows={2} maxLength={255}
                value={editingProduct.description}
                onChange={(e) => setEditingProduct((p) => ({ ...p, description: e.target.value }))}
                disabled={savingProduct}
              />
            </Field>
            <div className="field-grid">
              <Field id="product-price" label="Price (₱)">
                <input
                  id="product-price" type="number" min="0" max="99999999.99" step="0.01"
                  value={editingProduct.price}
                  onChange={(e) => setEditingProduct((p) => ({ ...p, price: e.target.value }))}
                  required disabled={savingProduct}
                />
              </Field>
              <Field id="product-stock" label="In stock">
                <input
                  id="product-stock" type="number" min="0" step="1"
                  value={editingProduct.stock}
                  onChange={(e) => setEditingProduct((p) => ({ ...p, stock: e.target.value }))}
                  required disabled={savingProduct || modal.id != null}
                />
              </Field>
            </div>
            {modal.id != null && (
              <p className="assistive-note">
                Stock is read-only in Edit. Use the Restock button to add units safely.
              </p>
            )}
            <Field id="product-threshold" label="Low stock threshold">
              <input
                id="product-threshold" type="number" min="0" step="1"
                value={editingProduct.minimumStockLevel}
                onChange={(e) => setEditingProduct((p) => ({ ...p, minimumStockLevel: e.target.value }))}
                required disabled={savingProduct}
              />
            </Field>
            <label className="checkbox-row">
              <input
                type="checkbox" checked={editingProduct.isAvailable}
                onChange={(e) => setEditingProduct((p) => ({ ...p, isAvailable: e.target.checked }))}
                disabled={savingProduct}
              />
              Visible on cashier menu when in stock
            </label>
            {formError && <p className="form-error" role="alert">{formError}</p>}
            <div className="dialog-actions">
              <button type="button" className="secondary-button" onClick={onClose} disabled={savingProduct}>Cancel</button>
              <button type="submit" className="primary-button" disabled={savingProduct}>
                {savingProduct ? 'Saving...' : 'Save item'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {modal?.type === 'restock' && (
        <Modal title={`Restock ${modal.name}`} onClose={onClose}>
          <form onSubmit={onRestockProduct} className="dialog-form">
            <p className="modal-explanation">
              Last loaded stock: {modal.stock} unit(s). The server will add the requested quantity
              to the current stock inside a database transaction.
            </p>
            <Field id="restock-quantity" label="Quantity to add">
              <input
                id="restock-quantity" type="number" min="1" max="2147483647" step="1"
                value={restockQuantity}
                onChange={(e) => setRestockQuantity(e.target.value)}
                required disabled={savingProduct}
              />
            </Field>
            {formError && <p className="form-error" role="alert">{formError}</p>}
            <div className="dialog-actions">
              <button type="button" className="secondary-button" onClick={onClose} disabled={savingProduct}>Cancel</button>
              <button type="submit" className="primary-button" disabled={savingProduct}>
                {savingProduct ? 'Restocking...' : 'Add stock'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {modal?.type === 'account' && (
        <Modal title="Add cashier account" onClose={onClose}>
          <form onSubmit={onAddAccount} className="dialog-form">
            <p className="modal-explanation">
              Creates a real Cashier login in MySQL. Choose an initial password (12–128 characters)
              and give it to the staff member securely. No email invitation is sent.
            </p>
            <Field id="account-name" label="Full name">
              <input id="account-name" value={accountForm.fullName}
                onChange={(e) => setAccountForm((f) => ({ ...f, fullName: e.target.value }))}
                required minLength={2} maxLength={100} disabled={savingAccount} />
            </Field>
            <Field id="account-email" label="Email">
              <input id="account-email" type="email" value={accountForm.email}
                onChange={(e) => setAccountForm((f) => ({ ...f, email: e.target.value }))}
                required maxLength={150} disabled={savingAccount} autoComplete="off" />
            </Field>
            <Field id="account-password" label="Initial password">
              <input id="account-password" type="password" value={accountForm.password}
                onChange={(e) => setAccountForm((f) => ({ ...f, password: e.target.value }))}
                required minLength={12} maxLength={128} disabled={savingAccount}
                autoComplete="new-password" />
            </Field>
            {formError && <p className="form-error" role="alert">{formError}</p>}
            <div className="dialog-actions">
              <button className="secondary-button" type="button" onClick={onClose} disabled={savingAccount}>Cancel</button>
              <button className="primary-button" type="submit" disabled={savingAccount}>
                {savingAccount ? 'Creating...' : 'Create cashier account'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {modal?.type === 'profile' && (
        <Modal title="Edit profile" onClose={onClose}>
          <form onSubmit={onSaveProfile} className="dialog-form">
            <Field id="profile-name" label="Full name">
              <input id="profile-name" value={profileForm.fullName} onChange={(e) => setProfileForm((f) => ({ ...f, fullName: e.target.value }))} required maxLength={100} disabled={savingProfile} />
            </Field>
            <Field id="profile-phone" label="Phone number">
              <input id="profile-phone" type="tel" value={profileForm.phoneNumber} onChange={(e) => setProfileForm((f) => ({ ...f, phoneNumber: e.target.value }))} maxLength={20} disabled={savingProfile} />
            </Field>
            <Field id="profile-address" label="Address">
              <textarea id="profile-address" rows={2} value={profileForm.address} onChange={(e) => setProfileForm((f) => ({ ...f, address: e.target.value }))} maxLength={255} disabled={savingProfile} />
            </Field>
            {formError && <p className="form-error" role="alert">{formError}</p>}
            <div className="dialog-actions">
              <button className="secondary-button" type="button" onClick={onClose} disabled={savingProfile}>Cancel</button>
              <button className="primary-button" type="submit" disabled={savingProfile}>{savingProfile ? 'Saving...' : 'Save profile'}</button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}

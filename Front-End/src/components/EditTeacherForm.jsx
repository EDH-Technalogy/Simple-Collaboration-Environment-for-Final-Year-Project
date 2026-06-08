import { useForm } from 'react-hook-form';
import { useEffect } from 'react';
import Field from './Field';
import Button from './Button';
import Icon from './Icon';
import IC from './IC';

function EditTeacherForm({ teacher, teachers, setTeachers, onClose }) {
  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm();

  useEffect(() => {
    if (teacher) {
      setValue('firstName', teacher.firstName);
      setValue('lastName', teacher.lastName);
      setValue('email', teacher.email);
      setValue('department', teacher.department);
    }
  }, [teacher, setValue]);

  const onSubmit = (data) => {
    const updatedTeachers = teachers.map(t => 
      t.id === teacher.id ? { ...t, ...data } : t
    );
    setTeachers(updatedTeachers);
    onClose();
  };

  return (
    <div className="w-[550px] max-h-[90vh] h-auto bg-shell dark:bg-dark-card p-6 rounded-lg shadow-xl flex flex-col">
      <div className="flex items-center justify-between mb-6 pb-2">
        <h2 className="text-lg font-bold text-primary dark:text-dark-primary">
          Edit Teacher: {teacher?.firstName} {teacher?.lastName}
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="h-10 w-10 p-2.5 bg-muted rounded-xl flex items-center justify-center transition-all hover:bg-accent"
        >
          <Icon d={IC.x} className="size-5" />
        </button>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 flex-1 overflow-y-auto pr-1 -mr-1">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field
            label="First Name"
            {...register('firstName', { required: 'First name is required' })}
            error={errors.firstName?.message}
            required
          />
          <Field
            label="Last Name"
            {...register('lastName', { required: 'Last name is required' })}
            error={errors.lastName?.message}
            required
          />
        </div>
        <Field
          label="Email"
          type="email"
          {...register('email', { required: 'Email is required' })}
          error={errors.email?.message}
          required
        />
        <Field
          label="Department"
          {...register('department', { required: 'Department is required' })}
          error={errors.department?.message}
          required
        />
        <div className="flex gap-3 pt-4 mt-2">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1 text-sm h-9">
            Cancel
          </Button>
          <Button type="submit" className="flex-1 text-sm h-9">
            Update Teacher
          </Button>
        </div>
      </form>
    </div>
  );
}

export default EditTeacherForm;


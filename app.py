import os
from datetime import datetime, date, timedelta
from itertools import groupby

from flask import Flask, render_template, request, redirect, url_for, flash, jsonify
from dotenv import load_dotenv

from models import db, Task, Exam, StudyPlan
from ai_engine import get_ai_priority

load_dotenv()

app = Flask(__name__)
app.config['SECRET_KEY'] = 'student-dashboard-secret'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///dashboard.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)


@app.context_processor
def inject_globals():
    return {
        'today': date.today(),
        'now': datetime.utcnow(),
    }


def format_grouped_study_plans(plans):
    grouped = []
    for study_date, items in groupby(plans, key=lambda item: item.study_date):
        grouped.append((study_date, list(items)))
    return grouped


def initialize_database():
    with app.app_context():
        db.create_all()
        if Task.query.count() == 0:
            sample_tasks = [
                Task(
                    title='Finish biology lab report',
                    description='Complete the lab write-up and include figures.',
                    deadline=datetime.combine(date.today(), datetime.min.time()) + timedelta(hours=18),
                    priority='high',
                ),
                Task(
                    title='Review calculus notes',
                    description='Practice integrals and review last lecture.',
                    deadline=datetime.combine(date.today(), datetime.min.time()) + timedelta(days=2, hours=20),
                    priority='medium',
                ),
                Task(
                    title='Prepare presentation slides',
                    description='Draft slides for Monday project meeting.',
                    deadline=datetime.combine(date.today(), datetime.min.time()) + timedelta(days=5, hours=17),
                    priority='low',
                ),
            ]
            sample_exams = [
                Exam(
                    subject='Physics Midterm',
                    exam_date=datetime.combine(date.today(), datetime.min.time()) + timedelta(days=6, hours=9),
                    venue='Room 102',
                    notes='Focus on mechanics and energy questions.',
                ),
                Exam(
                    subject='History Quiz',
                    exam_date=datetime.combine(date.today(), datetime.min.time()) + timedelta(days=9, hours=14),
                    venue='Room 218',
                    notes='Review the Renaissance and Enlightenment chapters.',
                ),
            ]
            sample_study_plan = [
                StudyPlan(
                    study_date=date.today(),
                    subject='Biology',
                    activity='Outline lab report structure.',
                    completed=False,
                ),
                StudyPlan(
                    study_date=date.today(),
                    subject='Calculus',
                    activity='Solve 5 integral practice problems.',
                    completed=False,
                ),
                StudyPlan(
                    study_date=date.today() + timedelta(days=1),
                    subject='Physics',
                    activity='Review formulas for midterm.',
                    completed=False,
                ),
            ]
            db.session.add_all(sample_tasks + sample_exams + sample_study_plan)
            db.session.commit()

initialize_database()


@app.route('/')
def dashboard():
    tasks = Task.query.filter_by(status='pending').order_by(Task.deadline).all()
    exams = Exam.query.order_by(Exam.exam_date).all()
    today_plans = StudyPlan.query.filter_by(study_date=date.today()).all()

    now = datetime.now()
    urgent_tasks = [task for task in tasks if 0 <= (task.deadline - now).days <= 3]
    urgent_exams = [exam for exam in exams if 0 <= (exam.exam_date - now).days <= 5]

    return render_template(
        'dashboard.html',
        tasks=tasks,
        exams=exams,
        today_plans=today_plans,
        urgent_tasks=urgent_tasks,
        urgent_exams=urgent_exams,
        today=date.today(),
    )


@app.route('/tasks')
def tasks_view():
    tasks = Task.query.order_by(Task.deadline).all()
    return render_template('tasks.html', tasks=tasks, today=date.today())


@app.route('/tasks/add', methods=['POST'])
def add_task():
    title = request.form.get('title', '').strip()
    description = request.form.get('description', '').strip()
    deadline_raw = request.form.get('deadline')
    priority = request.form.get('priority', 'medium')
    try:
        deadline = datetime.strptime(deadline_raw, '%Y-%m-%dT%H:%M')
    except Exception:
        flash('Invalid deadline format.', 'error')
        return redirect(url_for('tasks_view'))

    task = Task(title=title, description=description, deadline=deadline, priority=priority)
    db.session.add(task)
    db.session.commit()
    flash('Task added successfully!', 'success')
    return redirect(url_for('tasks_view'))


@app.route('/tasks/delete/<int:id>', methods=['POST'])
def delete_task(id):
    task = Task.query.get_or_404(id)
    db.session.delete(task)
    db.session.commit()
    flash('Task deleted.', 'success')
    return redirect(url_for('tasks_view'))


@app.route('/tasks/complete/<int:id>', methods=['POST'])
def complete_task(id):
    task = Task.query.get_or_404(id)
    task.status = 'completed'
    db.session.commit()
    flash('Task marked as complete!', 'success')
    return redirect(url_for('tasks_view'))


@app.route('/exams')
def exams_view():
    exams = Exam.query.order_by(Exam.exam_date).all()
    return render_template('exams.html', exams=exams, today=date.today())


@app.route('/exams/add', methods=['POST'])
def add_exam():
    subject = request.form.get('subject', '').strip()
    exam_date_raw = request.form.get('exam_date')
    venue = request.form.get('venue', '').strip()
    notes = request.form.get('notes', '').strip()
    try:
        exam_date = datetime.strptime(exam_date_raw, '%Y-%m-%dT%H:%M')
    except Exception:
        flash('Invalid exam date format.', 'error')
        return redirect(url_for('exams_view'))

    exam = Exam(subject=subject, exam_date=exam_date, venue=venue, notes=notes)
    db.session.add(exam)
    db.session.commit()
    flash('Exam added!', 'success')
    return redirect(url_for('exams_view'))


@app.route('/exams/delete/<int:id>', methods=['POST'])
def delete_exam(id):
    exam = Exam.query.get_or_404(id)
    db.session.delete(exam)
    db.session.commit()
    flash('Exam deleted.', 'success')
    return redirect(url_for('exams_view'))


@app.route('/planner')
def planner_view():
    plans = StudyPlan.query.order_by(StudyPlan.study_date).all()
    grouped = format_grouped_study_plans(plans)
    return render_template('planner.html', grouped_plans=grouped, today=date.today())


@app.route('/planner/add', methods=['POST'])
def add_study_plan():
    study_date_raw = request.form.get('study_date')
    subject = request.form.get('subject', '').strip()
    activity = request.form.get('activity', '').strip()
    try:
        study_date = date.fromisoformat(study_date_raw)
    except Exception:
        flash('Invalid study date format.', 'error')
        return redirect(url_for('planner_view'))

    plan = StudyPlan(study_date=study_date, subject=subject, activity=activity)
    db.session.add(plan)
    db.session.commit()
    flash('Study session added!', 'success')
    return redirect(url_for('planner_view'))


@app.route('/planner/toggle/<int:id>', methods=['POST'])
def toggle_study_plan(id):
    plan = StudyPlan.query.get_or_404(id)
    plan.completed = not plan.completed
    db.session.commit()
    flash('Progress updated!', 'success')
    return redirect(url_for('planner_view'))


@app.route('/planner/delete/<int:id>', methods=['POST'])
def delete_study_plan(id):
    plan = StudyPlan.query.get_or_404(id)
    db.session.delete(plan)
    db.session.commit()
    flash('Entry deleted.', 'success')
    return redirect(url_for('planner_view'))


@app.route('/api/ai-priority')
def ai_priority():
    tasks = Task.query.filter_by(status='pending').order_by(Task.deadline).all()
    exams = Exam.query.order_by(Exam.exam_date).all()
    result = get_ai_priority(tasks, exams)
    return jsonify(result)


if __name__ == '__main__':
    app.run(debug=True, port=5000)

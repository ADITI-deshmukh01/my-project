#include <iostream>
#include <fstream>
#include <vector>
#include <string>
using namespace std;

class Student {
private:
    int rollNo;
    string name;
    string department;
    string email;
    string phone;

public:
    Student() {}
    Student(int r, string n, string d, string e, string p) {
        rollNo = r;
        name = n;
        department = d;
        email = e;
        phone = p;
    }

    int getRollNo() { return rollNo; }
    string getName() { return name; }
    string getDept() { return department; }
    string getEmail() { return email; }
    string getPhone() { return phone; }

    void setName(string n) { name = n; }
    void setDept(string d) { department = d; }
    void setEmail(string e) { email = e; }
    void setPhone(string p) { phone = p; }

    void display() {
        cout << "Roll No: " << rollNo << "\nName: " << name
             << "\nDepartment: " << department << "\nEmail: " << email
             << "\nPhone: " << phone << "\n-------------------\n";
    }

    // Write object to file
    void saveToFile(ofstream &out) {
        out << rollNo << "," << name << "," << department << "," << email << "," << phone << endl;
    }

    // Read object from line
    static Student fromString(string line) {
        int r;
        string n, d, e, p;
        size_t pos = 0;
        vector<string> parts;
        while ((pos = line.find(",")) != string::npos) {
            parts.push_back(line.substr(0, pos));
            line.erase(0, pos + 1);
        }
        parts.push_back(line); // last part
        if (parts.size() == 5) {
            r = stoi(parts[0]);
            n = parts[1];
            d = parts[2];
            e = parts[3];
            p = parts[4];
            return Student(r, n, d, e, p);
        }
        return Student();
    }
};

class StudentSystem {
private:
    vector<Student> students;
    string filename = "students.txt";

    void loadFromFile() {
        students.clear();
        ifstream in(filename);
        string line;
        while (getline(in, line)) {
            if (!line.empty())
                students.push_back(Student::fromString(line));
        }
        in.close();
    }

    void saveToFile() {
        ofstream out(filename);
        for (auto &s : students) {
            s.saveToFile(out);
        }
        out.close();
    }

public:
    StudentSystem() {
        loadFromFile();
    }

    void addStudent() {
        int roll;
        string name, dept, email, phone;
        cout << "Enter Roll No: ";
        cin >> roll;
        cin.ignore();
        cout << "Enter Name: ";
        getline(cin, name);
        cout << "Enter Department: ";
        getline(cin, dept);
        cout << "Enter Email: ";
        getline(cin, email);
        cout << "Enter Phone: ";
        getline(cin, phone);

        students.push_back(Student(roll, name, dept, email, phone));
        saveToFile();
        cout << "✅ Student Added Successfully!\n";
    }

    void viewStudents() {
        if (students.empty()) {
            cout << "⚠️ No records found!\n";
            return;
        }
        for (auto &s : students) {
            s.display();
        }
    }

    void searchStudent() {
        int roll;
        cout << "Enter Roll No to Search: ";
        cin >> roll;
        bool found = false;
        for (auto &s : students) {
            if (s.getRollNo() == roll) {
                s.display();
                found = true;
                break;
            }
        }
        if (!found) cout << "❌ Student not found!\n";
    }

    void updateStudent() {
        int roll;
        cout << "Enter Roll No to Update: ";
        cin >> roll;
        cin.ignore();
        bool found = false;
        for (auto &s : students) {
            if (s.getRollNo() == roll) {
                string newName;
                cout << "Enter New Name: ";
                getline(cin, newName);
                s.setName(newName);
                saveToFile();
                cout << "✅ Student Updated!\n";
                found = true;
                break;
            }
        }
        if (!found) cout << "❌ Student not found!\n";
    }

    void deleteStudent() {
        int roll;
        cout << "Enter Roll No to Delete: ";
        cin >> roll;
        bool found = false;
        for (auto it = students.begin(); it != students.end(); ++it) {
            if (it->getRollNo() == roll) {
                students.erase(it);
                saveToFile();
                cout << "✅ Student Deleted!\n";
                found = true;
                break;
            }
        }
        if (!found) cout << "❌ Student not found!\n";
    }

    void menu() {
        int choice;
        do {
            cout << "\n--- Student Information System ---\n";
            cout << "1. Add Student\n2. View Students\n3. Search Student\n4. Update Student\n5. Delete Student\n6. Exit\n";
            cout << "Enter choice: ";
            cin >> choice;
            cin.ignore();

            switch (choice) {
                case 1: addStudent(); break;
                case 2: viewStudents(); break;
                case 3: searchStudent(); break;
                case 4: updateStudent(); break;
                case 5: deleteStudent(); break;
                case 6: cout << "👋 Exiting...\n"; break;
                default: cout << "❌ Invalid Choice!\n";
            }
        } while (choice != 6);
    }
};

int main() {
    StudentSystem system;
    system.menu();
    return 0;
}
